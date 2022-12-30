import { App, Editor, MarkdownView, Plugin, SuggestModal } from 'obsidian';

function getHeadings(): any[] {
	const { metadataCache } = this.app
	const workspace = this. app.workspace
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
				const headings = getHeadings();
				let content = "";
				const isSelection = editor.somethingSelected();
				const selection = editor.getSelection();
				const line = editor.getLine(editor.getCursor().line);

				// get the selection or line

				if (isSelection) {
					content = selection;
				} 
				else {
					content = line;
				}
				let position: string | any[] = []
				let existing = ""
				let isLast = false;

				// Get the existing content of the heading before adding the selected line 

				for (let i = 0; i < headings.length; i++) { 
					const heading = headings[i];
					if (heading.heading == header) { 
						if (i == headings.length - 1) { 
							position = [heading.position.start.line, -1];
						} 
						else { 
							position = [heading.position.start.line, headings[i + 1].position.start.line]; 
						} 
						if (heading.position.start.line == editor.lastLine()){
							isLast = true
							console.log("isLast is true")
						}
					} 
				} 
				if (position) {
					let newText = ""
					const oldText = doc.replace(content,"");
					if (isLast == false){ 
						existing = doc.split("\n").slice(position[0], position[1]).join("\n");
						const matchHeader = existing.match(/#.*/)
						if (!matchHeader) return[]
						const matchBody = existing.replace(/#.*/,"").trimStart();			
							if(choice == "prepend"){
								newText	= oldText.replace(existing,matchHeader[0] + "\n\n" + content + "\n" + matchBody);
							}
							
							if(choice == "append"){
								console.log(`existing = ${existing} and content = ${content}`)
								newText = oldText.replace(existing,existing + "\n" + content);
							}
						view.setViewData(newText, false)
					}
					else {
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
