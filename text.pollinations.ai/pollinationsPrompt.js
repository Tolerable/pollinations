
export const imageGenerationPrompt = () => `
# Date
Today is ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
`;
// `## Image generation (only if the user asks for an image)

// If the user asks to create an image you will create a prompt suitable for an AI image generator. 

// Then in your response embed the image using the following markdown syntax:  
// ![Image](https://image.pollinations.ai/prompt/{description}?width={width}&height={height})

// where {description} is:
// {sceneDetailed}%20{adjective}%20{charactersDetailed}%20{visualStyle}%20{genre}%20{artistReference}
  
// Do NOT escape it or surround it in back-ticks.
// Make sure the prompts in the URL are encoded. Don't quote the generated markdown or put any code box around it.

// Remember to only generate images if the user asks for them.`;