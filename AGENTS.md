# Agent Guidelines for artifact-converter-app

## Build/Lint/Test Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm test` - Run all tests
- `npm test -- path/to/test.spec.ts` - Run single test file
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## Code Style Guidelines
- **Framework**: Next.js 15 with TypeScript (strict mode enabled)
- **Components**: Use shadcn/ui components from `@/components/ui/`
- **Imports**: Use `@/` alias for src directory imports
- **Styling**: Tailwind CSS with `cn()` utility for class merging
- **State**: React hooks with "use client" directive for client components
- **Types**: Export interfaces, use explicit types, avoid `any`
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Files**: kebab-case for filenames, .tsx for React components
- **Error Handling**: Use try-catch blocks, display user-friendly messages
- **Icons**: Import from lucide-react package

## Claude 4 Prompt Engineering Best Practices

### General Principles

#### Be explicit with your instructions
Claude 4 models respond well to clear, explicit instructions. Being specific about your desired output can help enhance results. Customers who desire the "above and beyond" behavior from previous Claude models might need to more explicitly request these behaviors with Claude 4.

**Example: Creating an analytics dashboard**
- Instead of: "Create an analytics dashboard"
- Try: "Create an analytics dashboard. Include as many relevant features and interactions as possible. Go beyond the basics to create a fully-featured implementation."

#### Add context to improve performance
Providing context or motivation behind your instructions, such as explaining to Claude why such behavior is important, can help Claude 4 better understand your goals and deliver more targeted responses.

**Example: Formatting preferences**
Claude is smart enough to generalize from the explanation.

#### Be vigilant with examples & details
Claude 4 models pay attention to details and examples as part of instruction following. Ensure that your examples align with the behaviors you want to encourage and minimize behaviors you want to avoid.

### Guidance for Specific Situations

#### Control the format of responses
There are a few ways that we have found to be particularly effective in steering output formatting in Claude 4 models:

**Tell Claude what to do instead of what not to do**
- Instead of: "Do not use markdown in your response"
- Try: "Your response should be composed of smoothly flowing prose paragraphs."

**Use XML format indicators**
- Try: "Write the prose sections of your response in <smoothly_flowing_prose_paragraphs> tags."

**Match your prompt style to the desired output**
The formatting style used in your prompt may influence Claude's response style. If you are still experiencing steerability issues with output formatting, we recommend as best as you can matching your prompt style to your desired output style. For example, removing markdown from your prompt can reduce the volume of markdown in the output.

#### Leverage thinking & interleaved thinking capabilities
Claude 4 offers thinking capabilities that can be especially helpful for tasks involving reflection after tool use or complex multi-step reasoning. You can guide its initial or interleaved thinking for better results.

**Example prompt:**
```
After receiving tool results, carefully reflect on their quality and determine optimal next steps before proceeding. Use your thinking to plan and iterate based on this new information, and then take the best next action.
```

For more information on thinking capabilities, see Extended thinking.

#### Optimize parallel tool calling
Claude 4 models excel at parallel tool execution. They have a high success rate in using parallel tool calling without any prompting to do so, but some minor prompting can boost this behavior to ~100% parallel tool use success rate. We have found this prompt to be most effective:

**Sample prompt for agents:**
```
For maximum efficiency, whenever you need to perform multiple independent operations, invoke all relevant tools simultaneously rather than sequentially.
```

#### Reduce file creation in agentic coding
Claude 4 models may sometimes create new files for testing and iteration purposes, particularly when working with code. This approach allows Claude to use files, especially python scripts, as a 'temporary scratchpad' before saving its final output. Using temporary files can improve outcomes particularly for agentic coding use cases.

If you'd prefer to minimize net new file creation, you can instruct Claude to clean up after itself:

**Sample prompt:**
```
If you create any temporary new files, scripts, or helper files for iteration, clean up these files by removing them at the end of the task.
```

#### Enhance visual and frontend code generation
For frontend code generation, you can steer Claude 4 models to create complex, detailed, and interactive designs by providing explicit encouragement:

**Sample prompt:**
```
Don't hold back. Give it your all.
```

You can also improve Claude's frontend performance in specific areas by providing additional modifiers and details on what to focus on:
- "Include as many relevant features and interactions as possible"
- "Add thoughtful details like hover states, transitions, and micro-interactions"
- "Create an impressive demonstration showcasing web development capabilities"
- "Apply design principles: hierarchy, contrast, balance, and movement"

#### Avoid focusing on passing tests and hard-coding
Frontier language models can sometimes focus too heavily on making tests pass at the expense of more general solutions. To prevent this behavior and ensure robust, generalizable solutions:

**Sample prompt:**
```
Please write a high quality, general purpose solution. Implement a solution that works correctly for all valid inputs, not just the test cases. Do not hard-code values or create solutions that only work for specific test inputs. Instead, implement the actual logic that solves the problem generally.

Focus on understanding the problem requirements and implementing the correct algorithm. Tests are there to verify correctness, not to define the solution. Provide a principled implementation that follows best practices and software design principles.

If the task is unreasonable or infeasible, or if any of the tests are incorrect, please tell me. The solution should be robust, maintainable, and extendable.
```

### Migration Considerations

When migrating from Sonnet 3.7 to Claude 4:
- **Be specific about desired behavior**: Consider describing exactly what you'd like to see in the output.
- **Frame your instructions with modifiers**: Adding modifiers that encourage Claude to increase the quality and detail of its output can help better shape Claude's performance. For example, instead of "Create an analytics dashboard", use "Create an analytics dashboard. Include as many relevant features and interactions as possible. Go beyond the basics to create a fully-featured implementation."
- **Request specific features explicitly**: Animations and interactive elements should be requested explicitly when desired.

## Project-Specific Guidelines

### IMPORTANT: Single File Constraint
- **ALL improvements and features MUST be added directly to the existing artifact-converter.tsx file**
- **DO NOT create separate enhanced components or scripts**
- **The user has been extremely clear: "NO enhanced scripts"**
- **All functionality must be integrated into the single artifact-converter.tsx component**

### Required Improvements (All in artifact-converter.tsx)
1. **Separate swap and move functionality** - Different modes for swapping vs moving elements
2. **Fix grouping to select larger containers** - Select parent containers, not sub-components
3. **Fix page break recognition** - Properly detect and handle page boundaries
4. **Fix auto-align to respect page boundaries** - Alignment should not cross pages
5. **Fix move functionality for sub-containers** - Proper drag and drop for nested elements
6. **Add scaling/zoom options** - UI controls for zooming in/out
7. **Add editing improvements** - Undo/redo, visual guides, snapping to grid