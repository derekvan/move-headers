import { App, Editor, MarkdownView, Plugin, SuggestModal } from 'obsidian';

function getHeadings(): any[] {
	const { metadataCache } = this.app
	const workspace = this.app.workspace
	const fileTitle = workspace.getActiveFile();
	let headings: any[]
	if (fileTitle == null) {
		return[];
	} else {
		headings = metadataCache.getFileCache(fileTitle)?.headings;
		return headings
	}
// Get the headers and prompt user to select
	
}

function getHeaders(): string[]{
	const headings = getHeadings()
	const headers: any[] = []
	if (!headings) return [];
		headings.forEach(hh => {
		headers.push(hh.heading)
	});

	return headers
}

export default class MoveHeader extends Plugin {

	async onload() {

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'move-to-heading',
			name: 'Move text to heading',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				new HeaderModal(this.app, (value) => {
				}).open();
			}
		});
	}
}
			
				

class HeaderModal extends SuggestModal<string> {
    app: App;
	cb: (value:string) => void;

    constructor(app: App,cb: (value:string)=>void){
        super(app);
        this.app = app;
		this.cb = cb;
    }


		// Returns all available suggestions.
		getSuggestions(query: string) {
		const headers = getHeaders()
		return headers.filter((h: string) =>
			h.toLowerCase().includes(query.toLowerCase())
			);
		}

		// Renders each suggestion item.
		renderSuggestion(header: string, el: HTMLElement) {
			el.createEl("div", { text: header });
		}

		// Perform action on the selected suggestion.
		onChooseSuggestion(header: string, evt: MouseEvent | KeyboardEvent) {
			this.cb(header)
			new HeaderSecondModal(this.app, (choice) => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view) return []
				const editor = view.editor
				const doc = view.getViewData();
				let content = "";
				const isSelection = editor.somethingSelected();
				const selection = editor.getSelection();
				const lineNumber = editor.getCursor().line
				const line = editor.getLine(lineNumber);
				let oldText = ""
				// get the selection or line
				
				if (isSelection) {
					content = selection;
					oldText = doc.replace(content,"");
					//TODO:: how to say how many lines were pulled here, to reset the line positions below?
				} 
				else {
					content = line;
					editor.replaceRange("",{"line":lineNumber,"ch":0},{"line":lineNumber,"ch":Infinity})
					oldText = view.getViewData();
				}
				console.log("oldtext = \n" + oldText)
				let position: string | any[] = []
				let existing = ""
				let isLast = false;
				let isFinal = false
				
				// Loop through the headings array and find the selected heading
				const headings = getHeadings();
				for (let i = 0; i < headings.length; i++) { 
					const heading = headings[i];
					// Once the selected heading is found, determine if the heading is the last heading or not
					if (heading.heading == header) { 
						if (i == headings.length - 1) { // it's the last heading, so the position is the start of that heading and -1
							position = [heading.position.start.line, -1];
							if (choice == "append"){ //Since we're appending, set the boolean so we add to the end of document instead
								isFinal = true
							}
						} 
						else {  // it's not the last heading so the position is the start and end of the selected heading
							position = [heading.position.start.line, headings[i+1].position.start.line]; 
							console.log("position " + position)
						} 
						if (heading.position.start.line == editor.lastLine()){ // If the last heading is on the last line of the document, this is a special condition and needs to be addressed differently
							isLast = true
							console.log("isLast is true")
						}						
					} 
				} 
				if (position) {
					if (isLast == false){ // Since the heading isn't on the last line, perform normal replace actions
						existing = oldText.split("\n").slice(position[0], position[1]).join("\n");
						console.log(existing)
						const matchHeader = editor.getLine(position[0])
							if(choice == "prepend"){
								editor.replaceRange(`${matchHeader}\n\n${content.trimEnd()}`,{"line":position[0],"ch":0},{"line":position[0],"ch":Infinity})
							}
							
							if(choice == "append"){
								if (isFinal == false){ // Since it's not the final, replace the whole block
									editor.replaceRange(`${existing}\n${content.trimEnd()}`,{"line":position[0],"ch":0},{"line":(position[1])-1,"ch":Infinity})
								}
								if (isFinal == true){ // Since it's the last header, just add a line at the end of the document
									view.setViewData(oldText + "\n\n" + content,false)
								}
							}
						
					}
					else { // Since the heading is on the last line, we can just add the new content to the end of the document
						view.setViewData(oldText + "\n\n" + content,false)
					}			
			}

			}).open();
		}
}

class HeaderSecondModal extends SuggestModal<string> {
    app: App;
	cb2: (choice:string) => void;

    constructor(app: App,cb2: (choice:string)=>void){
        super(app);
        this.app = app;
		this.cb2 = cb2;
    }
		// Returns all available suggestions.
		getSuggestions(query: string) {
		const choices = ["prepend","append"]
		return choices.filter((c: string) =>
			c.toLowerCase().includes(query.toLowerCase())
			);
		}

		// Renders each suggestion item.
		renderSuggestion(c: string, el: HTMLElement) {
			el.createEl("div", { text: c });
		}

		// Perform action on the selected suggestion.
		onChooseSuggestion(c: string, evt: MouseEvent | KeyboardEvent) {
			this.cb2(c)
		}
}
