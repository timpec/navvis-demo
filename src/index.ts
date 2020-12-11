import "./index.scss";
import {
	getApi, ApiInterface
} from "@navvis/indoorviewer";

import {PoiExampleApp} from "./PoiExampleApp";

class TestApp
{
	//private baseUrl: string = "https://nvdev-0.iv.navvis.com/";
	private baseUrl2: string = "https://metropolia.esitevr.com/safetywalk/iv";

	constructor()
	{
		getApi(this.baseUrl2).then((iv) => this.startUp(iv));
	}

	/**
	 * Main entry point to start the application
	 * @param {ApiInterface} iv
	 */
	private startUp(iv: ApiInterface)
	{
		// Code added here will execute after IndoorViewer is completely loaded.
		const app = new PoiExampleApp(iv, this.baseUrl2);
		app.start();
	}

}

(<any>window).TestApp = new TestApp();
