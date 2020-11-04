/**
 * Class used to display a custom dialog which creates a POI Object of type Maintenance deferred.
 */
import {httpCall} from './emailservice';

export class IssueReportingDialog
{
	public title: string = "";

	public description: string = "";

	public category: string = "";

	public priority: string = "";

	public completionHandler: (title: string, description: string, category: string, priority: string, useCurrentPov: boolean) => void;

	private htmlModalElement: HTMLElement;

	constructor()
	{
		this.htmlModalElement = document.getElementById("issue-entry");
		const span = document.getElementById("issue-modal-close");
		span.onclick = () => this.hideDialog();

		const saveBtn = document.getElementById("save-issue");
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
		(<HTMLInputElement>document.getElementById("issue-priority")).value = this.priority;
	
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
		const priority = (<HTMLInputElement>document.getElementById("issue-priority")).value;

		const issueData = this.formatToJSON(title,description,category,priority)
		// POST request to backend to send email with data
		httpCall(issueData);

		const useCurrentPov = (<HTMLInputElement>document.getElementById("point-of-view")).checked;
		//this.completionHandler(title, description, category, priority, useCurrentPov);
		this.hideDialog();
	}

	/**
	 * Hide the Dialog
	 */
	private hideDialog(): void
	{
		(<HTMLInputElement>document.getElementById("issue-title")).value = "";
		(<HTMLTextAreaElement>document.getElementById("issue-description")).value = "";
		this.htmlModalElement.style.display = "none";
	}

	private formatToJSON(title: string, description: string, category: string, priority: string): any {
		const newJSON = {
			"title": title,
			"description": description,
			"category": category,
			"priority": priority
		}
		return newJSON;
	}
	
}
