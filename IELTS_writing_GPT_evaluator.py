from openai import OpenAI # type: ignore
import configparser, json, os

def ask_llm(prompt, client, model_name):
    print(f"Sending request to {model_name}...")
    try:
        resp = client.chat.completions.create(
                    model=model_name,
                    messages=[{"role": "user",
                               "content": prompt},
                    ]
                )
        answer = resp.choices[0].message.content
        print(f"Response received successfully for prompt: ...{prompt[37:60]}...")

        return answer.strip()
    except Exception as e:
        print(f"Error during API call: {str(e)}")
        raise

def get_essay(essay_file):
    with open(essay_file, 'r', encoding='utf-8') as f:
        text = f.read().strip()
    print(f"Import essay successfully : {essay_file}")
    return text

def load_prompt(aspects=None, prompt_prefix=None, task=2):
    text = []
    for aspect in aspects:
        with open(prompt_prefix+str(task)+"_prompt_"+aspect+".txt", 'r', encoding='utf-8') as f:
            text.append((aspect,f.read().strip()))
    return text

def load_summary_prompt(prompt_prefix):
    with open(prompt_prefix+"prompt_summary.txt", 'r', encoding='utf-8') as f:
        return f.read().strip() 

def load_polishing_prompt(prompt_prefix):
    with open(prompt_prefix+"prompt_polish.txt", 'r', encoding='utf-8') as f:
        return f.read().strip() 

def clean(text):
    text = text.replace('<br>',"\n")
    return text

def overall_assess(config_dict, client):
    overall_assessments = []
    prompts = load_prompt(config_dict['aspects'], config_dict['prefix'], config_dict['task'])
    short_names = config_dict['short_names']
    text = get_essay(config_dict['essay_file'])
    done = []
    feedbacks = []
    total_aspects = len(prompts)

    while True:
        for prompt in prompts:
            if prompt[0] in done:
                continue
            aspect_name = short_names.get(prompt[0], prompt[0])
            print(f"\nAnalyzing {aspect_name} ({len(done) + 1}/{total_aspects})...")
            
            query = prompt[1] + "\n" + text
            try:
                overall_assessments.append(clean(ask_llm(query, client, config_dict['model_name'])))
                done.append(prompt[0])
                print(f"✓ Completed {aspect_name}")
            except:
               continue

        if len(done) == total_aspects:
            print("\nAll aspects analyzed. Generating final summary...")
            init_prompt = load_summary_prompt(config_dict['prefix'])


            # Create final prompt with both summaries and detailed feedback
            for aspect, feedback in zip(done, overall_assessments):
                feedbacks.append(feedback)
            final_prompt = init_prompt + "\n\n" + "\n\n".join(feedbacks)
            
            try:
                final_summary = clean(ask_llm(final_prompt, client, config_dict['model_name']))
                overall_assessments.append(final_summary)
                done.append('summary')
                short_names['summary'] = 'Overall Assessment'
                print("✓ Final summary generated")
                print("\nGenerating feedback file...")
                break
            except Exception as e:
                print(f"× Failed to generate final summary: {str(e)}")        

    with open(config_dict['output_feedback_file'], 'w', encoding='utf-8') as f:
        f.write("## Task Description & My Writing:\n" + text.replace("\n","\n\n") + "\n\n---\n\n")
        for short_name,feedback in zip(done,overall_assessments):
            f.write("## "+short_names[short_name]+"\n" + feedback+"\n\n")
        print(f"Feedback file generated successfully: {config_dict['output_feedback_file']}")

    # Polishing the essay
    polishing_prompt = load_polishing_prompt(config_dict['prefix'])
    polishing_prompt = polishing_prompt + "\n\n" + "\n\n".join(feedbacks)
    try:
        polishing_result = clean(ask_llm(polishing_prompt, client, config_dict['model_name']))
        print("✓ Polishing result generated")
    except Exception as e:
        print(f"× Failed to generate polishing result: {str(e)}")
        polishing_result = "× Failed to generate polishing result"
    with open(config_dict['output_polish_file'], 'w', encoding='utf-8') as f:
        f.write(polishing_result)
    print(f"Polishing file generated successfully: {config_dict['output_polish_file']}")

if __name__ == '__main__':
    # Read configure and pack all configurations into a single dictionary
    config_file = 'key.cfg'
    config = configparser.ConfigParser()
    with open(config_file, encoding='utf-8') as f:
        config_text = f.read()
    config.read_string(config_text)
    config_dict = {
        'api_key': config.get('option', 'api_key'),
        'base_url': config.get('option', 'base_url'),
        'model_name': config.get('option', 'model_name'),
        'essay_file': config.get('option', 'essay_file'),
        'task': config.get('option', 'task'),
        'aspects': config.get('option', 'aspects').split(','),
        'prefix': config.get('option', 'prompt_prefix'),
        'short_names': json.loads(config.get('option', 'short_names'))
    }
    output_feedback_file =  os.path.splitext(config_dict['essay_file'])[0] + '_feedback.md'
    output_polish_file = os.path.splitext(config_dict['essay_file'])[0] + '_polish.md'

    base_url = config_dict['base_url']
    client = OpenAI(
            api_key=config_dict['api_key'],
            base_url=base_url if base_url else "https://api.deepseek.com/beta/v1"
            )
    
    overall_assess(config_dict, client)
