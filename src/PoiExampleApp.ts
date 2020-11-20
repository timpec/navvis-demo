import {
	ApiInterface,
	IconInfoInterface,
	PoiInterface,
	PoiTypeInterface,
	SidebarMenuItemInterface
} from "@navvis/indoorviewer";
import {IssueReportingContextMenuEntry} from "./IssueReportingContextMenuEntry";
import {IssueReportingDialog} from "./IssueReportingDialog";
import { httpCall } from "./emailservice";
//import { checkForUnnotified } from "./NotificationCheck";

/**
 * The main class for an example app which deals with POI objects shows the capabilities of the
 * Indoorviewer API. The app demonstrates the following capabilities of the api.
 * - Creation of special POIs using the context menu.
 * - Usage of onClick event to show your own POI Detail view and POI Editor.
 * - Highlights a list of POIs of a special type, and unhighlight all other POIs.
 * - Deletion of a POI.
 * - Usage of gotoPoi to move to a certain POI.
 * - Usage of the SidebarMenu API to show Custom Sidebar Menus.
 */
export class PoiExampleApp
{
	private readonly LOCALE: string = "en";

	private readonly MAINTENANCE_POI: string = "Safety Walks";

	private readonly MAINTENANCE_RESOLVED_POI: string = "Maintenance Resolved";

	private readonly MAINTENANCE_ISSUE_POI: string = "Maintenance Deferred";
	
	private readonly INSTRUCTION_POI: string = "Instruction";
	
	private readonly NOTIFIED_TAG: string = "POI Notified";

	private deferredMenuItem: SidebarMenuItemInterface;

	private resolvedMenuItem: SidebarMenuItemInterface;

	private poiMaintenanceResolvedType: PoiTypeInterface;

	private poiMaintenanceDeferredType: PoiTypeInterface;
	
	private instructionMenuItem: SidebarMenuItemInterface;

	private poiEducationalType: PoiTypeInterface;

	//private poiMaintenanceType: PoiTypeInterface;

	constructor(private ivApi: ApiInterface, private baseUrl: string)
	{
	}

	/**
	 * Start the application.
	 */
	public start(): void
	{
		Promise.all([//this.fetchPoiType(this.MAINTENANCE_POI),
		             this.fetchPoiType(this.MAINTENANCE_RESOLVED_POI),
					 this.fetchPoiType(this.MAINTENANCE_ISSUE_POI),
					 this.fetchPoiType(this.INSTRUCTION_POI)
					])
			.then((poiTypes: PoiTypeInterface[]) =>
			{
				console.log(poiTypes)
				if (poiTypes.indexOf(undefined) !== -1)
				{
					window.alert(
						"Please create the " + this.MAINTENANCE_ISSUE_POI + " and " +
						this.MAINTENANCE_RESOLVED_POI + " POI Types");
					return;
				}

				//this.poiMaintenanceType = poiTypes[0];
				this.poiMaintenanceResolvedType = poiTypes[0];
				this.poiMaintenanceDeferredType = poiTypes[1];
				this.poiEducationalType = poiTypes[2];
				this.deferredMenuItem = this.buildDeferredMaintenanceIssuesMenu();
				this.resolvedMenuItem = this.buildResolvedMaintenanceIssuesMenu();
				this.instructionMenuItem = this.buildInstructionMenu();
				this.ivApi.ui.sidebarMenuService.items.push(this.deferredMenuItem,
					this.resolvedMenuItem, this.instructionMenuItem);
				const entry = new IssueReportingContextMenuEntry(this.ivApi,
					this.poiMaintenanceDeferredType);
				
				//const iEntry = new EducationalMenuEntry(this.ivApi,
				//	this.poiEducationalType);
				entry.completionHandler = () => this.refreshState();
				//iEntry.completionHandler = () => this.refreshState();
				this.ivApi.poi.service.onPoiClick.connect(
					(poi) => this.handleMaintenanceIssueClick(poi));
				this.ivApi.poi.service.onPoiSave.connect((poi) => this.handleExternalPoiSave(poi));
				this.refreshState();
			});
	}

	/**
	 * Highlight all pending maintenance issues (having the POI type "Maintenance" and "Maintenance
	 * Deferred").
	 *
	 */
	private highlightPendingMaintenanceIssues(): void
	{
		this.fetchDeferredMaintenancePois().then((pois) =>
		{
			this.ivApi.poi.service.highlightPois(pois);
		});
	}

	/**
	 * Unhighlight all the resolved maintenance issues.
	 *
	 */
	private unhighlightResolvedMaintenanceIssues(): void
	{
		this.fetchResolvedMaintenancePois().then((pois) =>
		{
			this.ivApi.poi.service.unhighlightPois(pois);
		});
	}

	/**
	 * Handle the POI Save event from default POI creation flow to synchronize the custom menus and
	 * application state.
	 * @param {PoiInterface} poi The POI from the external interface
	 */
	private handleExternalPoiSave(poi: PoiInterface): void
	{
		console.log(poi);
		const poiTypes = [this.poiMaintenanceDeferredType.id,
						  this.poiMaintenanceResolvedType.id,
						  this.poiEducationalType.id];
		if (poiTypes.indexOf(poi.poiType.id) !== -1)
		{
			this.ivApi.poi.service.closePoi();
			this.refreshState();
		}
	}

	/**
	 * Refresh the current state of the app (refresh POIs, rebuild menus, highlight/unhighlight
	 * maintenance issues).
	 */
	private refreshState(): void
	{
		this.ivApi.poi.service.refreshPois();
		this.buildDeferredMaintenanceMenuItems();
		this.buildResolvedMaintenanceMenuItems();
		this.buildInstructionItems();
		//
		this.buildInstructionMenu();
		this.highlightPendingMaintenanceIssues();
		this.unhighlightResolvedMaintenanceIssues();
	}

	/**
	 * Handle an onPoiClick for maintenance issues.
	 * @param {PoiInterface} poi The POI clicked.
	 * @returns {boolean} True, if it is a maintenance issue and a click was handled, false
	 *     otherwise.
	 */
	private handleMaintenanceIssueClick(poi: PoiInterface): boolean
	{
		if (poi.poiType.name[this.LOCALE] == this.MAINTENANCE_ISSUE_POI) {

		this.hideMaintenanceDetailView();
		this.ivApi.poi.service.closePoi();
		this.ivApi.ui.sidebarMenuService.closeMenu();
		const maintenanceTypeIds = [this.poiMaintenanceDeferredType.id,
									this.poiMaintenanceResolvedType.id,
								    this.poiEducationalType.id];
		console.log(maintenanceTypeIds.indexOf(poi.poiType.id))
		if (maintenanceTypeIds.indexOf(poi.poiType.id) === -1)
		{
			return false;
		}
		this.ivApi.poi.service.goToPoi(poi).catch((e) => console.error(e));
		this.showMaintenanceDetailView(poi);
		return true;
	} else {
		return false;
	}
	}

	/**
	 * Show the custom maintenance issue detail view.
	 * @param {PoiInterface} poi The POI to show in the detail view.
	 */
	private showMaintenanceDetailView(poi: PoiInterface): void
	{
		const modal = document.getElementById("issue-details");
		modal.style.display = "block";

		const closeBtn = document.getElementById("issue-close");
		closeBtn.onclick = () => this.hideMaintenanceDetailView();

		const editBtn = document.getElementById("issue-edit");
		editBtn.onclick = () => this.showPoiEditDialog(poi);

		this.configureResolutionBtn(poi);

		const label = document.getElementById("issue-name");
		label.innerText = poi.title;

		const icon = <HTMLImageElement>(document.getElementsByClassName("issue-icon").item(0));
		icon.src = this.baseUrl + poi.icon;

		const description = document.getElementById("issue-detail-description");
		description.innerText = poi.description !== undefined ? poi.description : "";
	}

	/**
	 * Close the custom detail view for maintenance POI.
	 */
	private hideMaintenanceDetailView(): void
	{
		const modal = document.getElementById("issue-details");
		modal.style.display = "none";
	}

	/**
	 * Change the POI type to resolve.
	 * @param {PoiInterface} poi The POI that needs to be resolved.
	 */
	private resolveMaintenancePoi(poi: PoiInterface): void
	{
		console.log("resolved: ", poi.poiType.id)
		poi.poiType = this.poiMaintenanceResolvedType;
		this.savePoi(poi).catch((e) => console.error(e));
	}

	/**
	 * Shows the edit dialog for editing a custom POI.
	 * @param {PoiInterface} poi The POI that needs to be edited.
	 */
	private showPoiEditDialog(poi: PoiInterface): void
	{
		const dialog = new IssueReportingDialog();
		dialog.title = poi.title;

		dialog.description = poi.description !== undefined ? poi.description : "";

		dialog.completionHandler = (title, description, category, priority) =>
		{
			poi.title = title;
			poi.description = description;
			this.savePoi(poi).then((poi) => this.showMaintenanceDetailView(poi)
			).catch((e) => console.error(e));
		};
		dialog.showDialog();
	}

	/**
	 * Fetches the POI with the given name.
	 * @param {String} name The name of the PoiType you want to fetch.
	 * @returns {Promise<PoiTypeInterface>} A promise with the POI type, or undefined, if the type
	 *     was not found.
	 */
	private fetchPoiType(name: String): Promise<PoiTypeInterface>
	{
		return this.ivApi.poi.poiTypeRepository.findAll().then((poiTypes) =>
		{
			const filteredPois = poiTypes.filter((poiType) => poiType.name[this.LOCALE] === name);

			return filteredPois[0];
		});
	}

	/**
	 * Fetch the POIs with the type Maintenance Deferred.
	 * @returns {Promise<PoiInterface[]>} A promise with the POIs.
	 */
	private fetchDeferredMaintenancePois(): Promise<PoiInterface[]>
	{
		return this.ivApi.poi.repository.findAll()
			.then((pois) => pois.filter(
				(poi) => [this.MAINTENANCE_POI, this.MAINTENANCE_ISSUE_POI].indexOf(
					poi.poiType.name[this.LOCALE]) !== -1));
	}

	/**
	 * Fetch resolved POIs.
	 * @returns {Promise<PoiInterface[]>} A promise with the POIs.
	 */
	private fetchResolvedMaintenancePois(): Promise<PoiInterface[]>
	{
		return this.ivApi.poi.repository.findAll()
			.then((pois) => pois.filter(
				(poi) => poi.poiType.name[this.LOCALE] === this.MAINTENANCE_RESOLVED_POI));
	}

	private fetchInstructionPois(): Promise<PoiInterface[]>
	{
		return this.ivApi.poi.repository.findAll()
			.then((pois) => pois.filter(
				(poi) => poi.poiType.name[this.LOCALE] === this.INSTRUCTION_POI));
	}

	/**
	 * Build the resolved maintenance issue menu.
	 * @returns {SidebarMenuItemInterface} The SidebarMenuItemInterface used to create the menu.
	 */
	private buildResolvedMaintenanceIssuesMenu(): SidebarMenuItemInterface
	{
		const icon: IconInfoInterface = {className: "material-icons", ligature: "done", path: ""};
		const items: SidebarMenuItemInterface[] = [];
		return {
			title: "Maintenance Resolved Issues",
			icon: icon,
			isPreviewIconVisible: () => true,
			isFullscreen: false,
			isVisible: () => true,
			items: items,
			onClick: () => true,
			template: "./menu.html"
		};
	}

	/**
	 * Build the maintenance issue menu.
	 * @returns {SidebarMenuItemInterface} The SidebarMenuItemInterface used to create the menu.
	 */
	private buildDeferredMaintenanceIssuesMenu(): SidebarMenuItemInterface
	{
		const icon: IconInfoInterface = {
			className: "material-icons",
			ligature: "report_problem",
			path: ""
		};
		const items: SidebarMenuItemInterface[] = [];
		return {
			title: "Maintenance Issues",
			icon: icon,
			isPreviewIconVisible: () => true,
			isFullscreen: false,
			isVisible: () => true,
			items: items,
			onClick: () => true,
			template: "./menu.html"
		};
	}

	//@returns {SidebarMenuItemInterface} The SidebarMenuItemInterface used to create the menu.
	
	private buildInstructionMenu(): SidebarMenuItemInterface
	{
		const icon: IconInfoInterface = {
			className: "material-icons",
			ligature: "book",
			path: ""
		};
		const items: SidebarMenuItemInterface[] = [];
		return {
			title: "Instruction POI's",
			icon: icon,
			isPreviewIconVisible: () => true,
			isFullscreen: false,
			isVisible: () => true,
			items: items,
			onClick: () => true,
			template: "./menu.html"
		};
	}

	
	private buildInstructionItems(): void
	{
		const icon: IconInfoInterface = {
			className: "material-icons",
			ligature: "book",
			path: ""
		};
		const items: SidebarMenuItemInterface[] = [];

		this.fetchInstructionPois().then((pois) =>
		{
			this.instructionMenuItem.items = pois.map((poi) => ({
				title: poi.title,
				icon: icon,
				isPreviewIconVisible: () => true,
				isFullscreen: false,
				isVisible: () => true,
				items: items,
				onClick: () =>
				{
					this.ivApi.ui.sidebarMenuService.closeMenu();
					this.ivApi.poi.service.goToPoi(poi).catch((e) => console.error(e));
				},
				template: ""
			}));
			console.log(this.instructionMenuItem)
			this.instructionMenuItem.template = pois.length === 0 ? "./menu.html" : "";
		});
	}
	
	
	/**
	 * Build the items for the maintenance issue menu.
	 */
	private buildDeferredMaintenanceMenuItems(): void
	{
		const icon: IconInfoInterface = {
			className: "material-icons",
			ligature: "report_problem",
			path: ""
		};
		const items: SidebarMenuItemInterface[] = [];

		this.fetchDeferredMaintenancePois().then((pois) =>
		{
			this.checkForUnnotified(pois);
			this.deferredMenuItem.items = pois.map((poi) => ({
				title: poi.title,
				icon: icon,
				isPreviewIconVisible: () => true,
				isFullscreen: false,
				isVisible: () => true,
				items: items,
				onClick: () =>
				{
					this.ivApi.ui.sidebarMenuService.closeMenu();
					this.ivApi.poi.service.goToPoi(poi).catch((e) => console.error(e));
				},
				template: ""
			}));
			this.deferredMenuItem.template = pois.length === 0 ? "./menu.html" : "";
		});
	}

	/**
	 * Build the items for the resolved maintenance issue menu.
	 */
	private buildResolvedMaintenanceMenuItems(): void
	{
		const icon: IconInfoInterface = {
			className: "material-icons",
			ligature: "done",
			path: ""
		};
		const items: SidebarMenuItemInterface[] = [];

		this.fetchResolvedMaintenancePois().then((pois) =>
		{
			this.resolvedMenuItem.items = pois.map((poi) => ({
				title: poi.title,
				icon: icon,
				isPreviewIconVisible: () => true,
				isFullscreen: false,
				isVisible: () => true,
				items: items,
				onClick: () =>
				{
					this.ivApi.ui.sidebarMenuService.closeMenu();
					this.ivApi.poi.service.goToPoi(poi).catch((e) => console.error(e));
				},
				template: ""
			}));
			this.resolvedMenuItem.template = pois.length === 0 ? "./menu.html" : "";
		});
	}

	/**
	 * Save the POI to the server.
	 * @returns {Promise<PoiInterface>} A promise with the saved POI object from the server.
	 */
	private savePoi(poi: PoiInterface): Promise<PoiInterface>
	{
		return this.ivApi.poi.repository.save(poi).then((pois) =>
		{
			const savedPoi = pois[0];

			this.refreshState();
			this.ivApi.poi.service.goToPoi(savedPoi).catch((e) => console.error(e));
			return savedPoi;
		});
	}

	private checkForUnnotified(pois: PoiInterface[]) {
		for (let i in pois) {
			console.log(pois[i].customData);
			if (pois[i].customData != this.NOTIFIED_TAG) {
				let data = {
					type: "new-issue",
					title: pois[i].title,
					description: pois[i].description
				}
				httpCall(data)
				console.log("Notified for POI: ", pois[i].title);

				pois[i].customData = this.NOTIFIED_TAG;
				this.savePoi(pois[i])
				console.log(pois[i].customData)
			}
		}
	}

	/**
	 * Change the Resolution button from Resolve to Delete, depending upon the type of the POI.
	 */
	private configureResolutionBtn(poi: PoiInterface): void
	{
		const btn = document.getElementById("issue-resolve");

		if (poi.poiType.id === this.poiMaintenanceResolvedType.id)
		{
			btn.innerText = "Delete";
			btn.onclick = () =>
			{
				this.ivApi.poi.repository.remove(poi).then(() =>
				{
					this.hideMaintenanceDetailView();
					this.refreshState();
				});
			};
		}
		else
		{
			btn.innerText = "Resolve";
			btn.onclick = () =>
			{
				const data = {
					"type": "resolve-issue",
					"title": poi.title,
					"description": poi.description
				}
				httpCall(data)
				this.resolveMaintenancePoi(poi);
				this.hideMaintenanceDetailView();
				this.refreshState();
			};
		}
	}
}
