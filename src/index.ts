import "./index.scss";
import {
	getApi, ApiInterface
} from "@navvis/indoorviewer";

import {PoiExampleApp} from "./PoiExampleApp";

class TestApp
{
	private baseUrl: string = "https://nvdev-0.iv.navvis.com/";

	constructor()
	{
		getApi(this.baseUrl).then((iv) => this.startUp(iv));
	}

	/**
	 * Main entry point to start the application
	 * @param {ApiInterface} iv
	 */
	private startUp(iv: ApiInterface)
	{
		// Code added here will execute after IndoorViewer is completely loaded.
		const app = new PoiExampleApp(iv, this.baseUrl);
		app.start();
	}

}

(<any>window).TestApp = new TestApp();
