import OpenAI from "openai";
import guidelinesData from './guidelines.json';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

function renderMarkdownToHTML(markdownText) {
  if (!markdownText) return '';

  
  const lines = markdownText.split('\n');

  let html = '';
  let inList = false;

  lines.forEach(line => {
    line = line.trim();

    
    if (line.startsWith('## ')) {
      html += `<h2>${line.slice(3)}</h2>`;
      return;
    }

    
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    
    if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${line.replace(/^[-*]\s+/, '')}</li>`;
    } else if (/^\d+\.\s+/.test(line)) {
      if (!inList) {
        html += '<ol>';
        inList = true;
      }
      html += `<li>${line.replace(/^\d+\.\s+/, '')}</li>`;
    } else {
      if (inList) {
        html += '</ul>'; 
        inList = false;
      }
      if (line) html += `<p>${line}</p>`;
    }
  });

  if (inList) html += '</ul>';

  return html;
}

function formatGuidelines(data) {
  const chunks = [];
  
  
  if (data.categories) {
    for (const [key, section] of Object.entries(data.categories)) {
      if (section.title && section.content) {
        
        const titleChunk = `## ${section.title}`;
        chunks.push(titleChunk);
        
        
        section.content.forEach(item => {
          chunks.push(item);
        });
      }
    }
  } 
  
  else if (data.content && Array.isArray(data.content)) {
    chunks.push(...data.content);
  }
  
  return chunks.filter(chunk => chunk && chunk.length > 20);
}

const guidelineChunks = formatGuidelines(guidelinesData);

function findRelevantGuidelines(question, allGuidelines, maxChunks = 15) {
  const questionLower = question.toLowerCase();
  const keywords = questionLower.split(/\s+/).filter(w => w.length > 3);
  

  const scored = allGuidelines.map(guideline => {
    const textLower = guideline.toLowerCase();
    let score = 0;
    
    
    if (textLower.includes(questionLower)) {
      score += 10;
    }
    
    
    keywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        score += 1;
      }
    });
    
    
    if (guideline.startsWith('##')) {
      score += 2;
    }
    
    return { guideline, score };
  });
  
  
  const relevant = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map(item => item.guideline);
  
  
  if (relevant.length === 0) {
    return allGuidelines.slice(0, 10);
  }
  
  return relevant;
}

async function init() {
  const form = document.querySelector('form');
  const wrapper = document.getElementById('status');
  const answer = document.getElementById('response');
  const qa = document.getElementById('question');
  const btn = document.getElementById('ask');
  
  wrapper.classList.add('tag');
  wrapper.textContent = `Ready! Loaded ${guidelineChunks.length} guidelines from Storybook (v${guidelinesData.version})`;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const question = qa.value.trim();
    if (!question) {
      wrapper.textContent = 'Please enter a question.';
      return;
    }

    wrapper.textContent = 'Thinking...';
    btn.disabled = true;

    try {
      
      const relevantGuidelines = findRelevantGuidelines(question, guidelineChunks);
      
      console.log(`Using ${relevantGuidelines.length} relevant guidelines for this question`);

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert assistant specialized in the Alloy Design System. 
Respond exclusively based on the official Alloy design guidelines provided. 
If the information is not found in the guidelines, clearly state: "I didn’t find specific information about this in the Alloy guidelines."
Always cite the relevant sections when applicable. 
IMPORTANT: Always respond in English, regardless of the language of the user's question.`
          },
          {
            role: "user",
            content: `Guidelines de Alloy:\n\n${relevantGuidelines.join("\n\n")}\n\n---\n\nPregunta: ${question}`
          }
        ],
        temperature: 0.3, 
      });
    
      wrapper.textContent = 'Answer completed';
      answer.innerHTML = renderMarkdownToHTML(response.choices[0].message.content);

    } catch (error) {
      wrapper.classList.add('tag--warning')
      wrapper.textContent = `Error: ${error.message}`;
      console.error('OpenAI API Error:', error);
    } finally {
      btn.disabled = false;
    }
  });
  }

init();