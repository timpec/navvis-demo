/**
 * Class used to display a custom dialog which creates a POI Object of type Maintenance deferred.
 */
import {httpCall} from './emailservice';

export class EducationalDialog
{
	public title: string = "";

	public description: string = "";

	public category: string = "";

	public completionHandler: (title: string, description: string, category: string, useCurrentPov: boolean) => void;

	private htmlModalElement: HTMLElement;

	constructor()
	{
		this.htmlModalElement = document.getElementById("instruction-entry");
		const span = document.getElementById("instruction-modal-close");
		span.onclick = () => this.hideDialog();

		const saveBtn = document.getElementById("save-instruction");
		saveBtn.onclick = () => this.saveIssue();

		this.htmlModalElement.onclick = () =>
		{
			if (event.target === this.htmlModalElement)
			{
				this.hideDialog();
			}
		};
	}

	/**
	 * Show the dialog to the user
	 */
	public showDialog(): void
	{
		(<HTMLInputElement>document.getElementById("issue-title")).value = this.title;
		(<HTMLTextAreaElement>document.getElementById("issue-description")).value =
			this.description;
		(<HTMLInputElement>document.getElementById("issue-category")).value = this.category;
	
		this.htmlModalElement.style.display = "block";
	}

	/**
	 * create the issue POI from the data in the dialog.
	 */
	public saveIssue(): void
	{
		const title = (<HTMLInputElement>document.getElementById("issue-title")).value;
		const description = (<HTMLTextAreaElement>document.getElementById(
			"issue-description")).value;
		const category = (<HTMLInputElement>document.getElementById("issue-category")).value;

		const instructionData = this.formatToJSON(title,description,category)
		// POST request to backend to send email with data
		httpCall(instructionData);

		const useCurrentPov = (<HTMLInputElement>document.getElementById("point-of-view")).checked;
		//this.completionHandler(title, description, category, useCurrentPov);
		this.hideDialog();
	}

	/**
	 * Hide the Dialog
	 */
	private hideDialog(): void
	{
		(<HTMLInputElement>document.getElementById("instruction-title")).value = "";
		(<HTMLTextAreaElement>document.getElementById("instruction-description")).value = "";
		this.htmlModalElement.style.display = "none";
	}

	private formatToJSON(title: string, description: string, category: string): any {
		const newJSON = {
			"title": title,
			"description": description,
			"category": category,
		}
		return newJSON;
	}
	
}
