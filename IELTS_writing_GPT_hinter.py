from openai import OpenAI # type: ignore
import configparser, os

def ask_llm(messages, client, model_name):
    print(f"Sending request to {model_name}...")
    try:
        resp = client.chat.completions.create(
                    model=model_name,
                    messages=messages
                )
        answer = resp.choices[0].message.content
        print(f"Response received successfully for prompt: ...{messages[-1]['content'][:25]}...")

        return answer.strip()
    except Exception as e:
        print(f"Error during API call: {str(e)}")
        raise

def load_prompt(topic_file, prompt_prefix, task):
    with open(topic_file, 'r', encoding='utf-8') as f:
        topic_text = f.read().strip()

    prompts = []
    with open(prompt_prefix+str(task)+"_prompt_writing_sample.txt", 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                prompts.append(line)

    if prompts:
        prompts[0] = topic_text + "\n" + prompts[0]
    return prompts

def clean(text):
    text = text.replace('<br>',"\n")
    return text

def overall_assess(config_dict, client):
    overall_assessments = []
    prompts = load_prompt(config_dict['topic_file'], config_dict['prefix'], config_dict['task'])
    done = []
    feedbacks = []
    total_aspects = len(prompts)
    conversation_history = []  # 用于存储对话历史

    while True:
        for prompt in prompts:
            print(f"\nAnalyzing {prompt[:25]}...")
            
            try:
                conversation_history.append({"role": "user", "content": prompt})
                response = ask_llm(conversation_history, client, config_dict['model_name'])
                conversation_history.append({"role": "assistant", "content": response})
                
                overall_assessments.append(clean(response))
                done.append(1)
                print(f"✓ Completed {prompt[:25]}...")
            except:
                continue

        if len(done) == total_aspects:
            print("\nAll analyzed. Generating final summary...")

            for _, feedback in zip(done, overall_assessments):
                feedbacks.append(feedback)
            final_summary = "\n\n" + "\n\n".join(feedbacks)
            print("✓ Final summary generated")
            print("\nGenerating hinter file...")
            break
                    
    with open(config_dict['topic_file'], 'r', encoding='utf-8') as topic_f:
        topic_content = topic_f.read()
    with open(config_dict['output_hinter_file'], 'w', encoding='utf-8') as f:
        f.write(topic_content + "\n\n" + final_summary)
    print(f"Hinter file generated successfully: {config_dict['output_hinter_file']}")

if __name__ == '__main__':
    config_file = 'key.cfg'
    config = configparser.ConfigParser()
    with open(config_file, encoding='utf-8') as f:
        config_text = f.read()
    config.read_string(config_text)
    config_dict = {
        'api_key': config.get('option', 'api_key'),
        'base_url': config.get('option', 'base_url'),
        'model_name': config.get('option', 'model_name'),
        'topic_file': config.get('option', 'topic_file'),
        'task': config.get('option', 'task'),
        'prefix': config.get('option', 'prompt_prefix'),
    }
    output_hinter_file = os.path.splitext(config_dict['topic_file'])[0] + '_hinter.md'

    base_url = config_dict['base_url']
    client = OpenAI(
            api_key=config_dict['api_key'],
            base_url=base_url if base_url else "https://api.deepseek.com/beta/v1"
            )
    
    overall_assess(config_dict, client)
