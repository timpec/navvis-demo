import {
	ApiInterface,
	ContextMenuEntryInterface,
	CursorDataInterface,
	CustomLayer,
	MouseEventCoordinatesInterface,
	PoiInterface,
	PoiTypeInterface
} from "@navvis/indoorviewer";
import {IssueReportingDialog} from "./IssueReportingDialog";
import {Euler} from "three";

export class IssueReportingContextMenuEntry extends CustomLayer
{
	
	private readonly NOTIFIED_TAG: string = "POI Notified";

	public completionHandler: () => void;

	private readonly LOCALE: string = "en";

	constructor(private ivApi: ApiInterface, private issueType: PoiTypeInterface)
	{
		super(ivApi.view.mainView);
	}

	public onContextMenu(pos: MouseEventCoordinatesInterface): ContextMenuEntryInterface
	{
		return {
			name: "Report Issue",
			icon: undefined,
			callback: () =>
			{
				this.createMaintenanceIssue();
			}
		};
	}

	/**
	 * Show a dialog to create a maintenance issue.
	 */
	private createMaintenanceIssue(): void
	{
		const dialog = new IssueReportingDialog();
		const currentCursorPosition = this.ivApi.view.mainView.getCurrentCursorPosition();
		dialog.completionHandler = (title, description, category, priority) => //, useCurrentPov
		{
			this.createPoi(title, description, category, priority, currentCursorPosition) //, useCurrentPov
				.catch((e) => console.error(e));
		};
		dialog.showDialog();
	}

	/**
	 * Create Poi with the given parameters.
	 * If useCurrentPov is set to true, the current camera position and view configuration will be used
	 * to set the POI's POV.
	 * @returns {Promise<PoiInterface>} A promise with the saved POI object from the server.
	 */
	private createPoi(title: string, description: string, category: string, priority: string,
		cursorPosition: CursorDataInterface): Promise<PoiInterface> //, useCurrentPov: boolean
	{
		const poi = this.ivApi.poi.repository.create();
		poi.titles[this.LOCALE] = title;
		poi.descriptions[this.LOCALE] = description;
		poi.customData = this.NOTIFIED_TAG;
		poi.icon = undefined;
		poi.importance = 1; // Used for status. 1 = reported, 2 = Being resolved, 3 = Resolved
		const localToGlobal = this.ivApi.transform.service.localToGlobal;
		poi.globalLocation = localToGlobal.transform(cursorPosition.location);
		poi.globalOrientation =
			localToGlobal.transformQuaternion(cursorPosition.orientation);
		poi.datasetLocation = cursorPosition.datasetLocation;
		poi.datasetOrientation = cursorPosition.datasetOrientation;
		poi.orientation = cursorPosition.orientation;
		console.log(poi)
		poi.poiType = this.issueType;
		console.log(poi.poiType)

		/*
		if (useCurrentPov)
		{
			// Set a custom POV
			const cameraPosition = this.ivApi.view.mainView.getCamera().position;
			const currentLocation = this.ivApi.transform.service.localToGlobal.transform(cameraPosition);
			const currentFov = this.ivApi.view.mainView.getFov();
			const currentViewDirection = this.ivApi.view.mainView.currViewingDir;
			const viewDirectionQuaternion = new this.ivApi.lib.THREE.Quaternion()
				.setFromEuler(new Euler(currentViewDirection.lon, currentViewDirection.lat, 0))
			poi.setPointOfView(currentLocation, viewDirectionQuaternion, currentFov, undefined);
		}
		*/

		return this.ivApi.poi.repository.save(poi).then((pois) =>
		{
			const savedPoi = pois[0];
			this.ivApi.poi.service.goToPoi(savedPoi).catch((e) => console.error(e));
			this.completionHandler();
			return savedPoi;
		});
	}
}
