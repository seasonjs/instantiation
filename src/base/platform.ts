/*---------------------------------------------------------------------------------------------
 *  Copyright (c) seasonjs. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const setTimeout0IsFaster = (typeof globalThis.postMessage === 'function' && !globalThis.importScripts);

/**
 * See https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#:~:text=than%204%2C%20then-,set%20timeout%20to%204,-.
 *
 * Works similarly to `setTimeout(0)` but doesn't suffer from the 4ms artificial delay
 * that browsers set when the nesting level is > 5.
 */
export const setTimeout0 = (() => {
	if (setTimeout0IsFaster) {
		interface IQueueElement {
			id: number;
			callback: () => void;
		}
		const pending: IQueueElement[] = [];
		globalThis.addEventListener('message', (e: MessageEvent) => {
			if (e.data && e.data.vscodeScheduleAsyncWork) {
				for (let i = 0, len = pending.length; i < len; i++) {
					const candidate = pending[i];
					if (candidate.id === e.data.vscodeScheduleAsyncWork) {
						pending.splice(i, 1);
						candidate.callback();
						return;
					}
				}
			}
		});
		let lastId = 0;
		return (callback: () => void) => {
			const myId = ++lastId;
			pending.push({
				id: myId,
				callback: callback
			});
			globalThis.postMessage({ vscodeScheduleAsyncWork: myId }, '*');
		};
	}
	return (callback: () => void) => setTimeout(callback);
})();
