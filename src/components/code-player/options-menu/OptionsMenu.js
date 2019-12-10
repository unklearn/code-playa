import React, { useState } from 'react';
import GearIcon from './GearIcon';
import OptionsPopup from './OptionsPopup';
import { MODES } from './CodeMirrorConstants';
import './OptionsMenu.css';

function makeLanguageMenuItem(object) {
	if (!object) {
		return;
	}
	if (object.children && Array.isArray(object.children)) {
		return {
			component: <span>{object.name}</span>,
			items: object.children.map((child) => makeLanguageMenuItem(child))
		};
	} else {
		return {
			component: (<span>{object.name}</span>),
			key: 'mode',
			directory: object.dir,
			value: object.type
		};
	}
}

function makeSpeedComponents() {
	return [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((d) => {
		return {
			component: `${d}x`,
			key: 'speed',
			value: d
		};
	});
}

const menu = {
	items: [{
		component: (<span>Language</span>),
		items: MODES.map((mode) => makeLanguageMenuItem(mode))
	}, {
		component: (<span>Speed</span>),
		items: makeSpeedComponents()
	}]
};

export default function OptionsMenu(props) {
	const [showPopup, setPopupVisibility] = useState(false);
	const {
		options,
		setOption
	} = props;
	function setNewOption(...args) {
		setPopupVisibility(false);
		setOption(...args);
	}
	return (
		<div className='unk-code-playa-options-menu'>
			<GearIcon onClick={() => setPopupVisibility(!showPopup)}/>
			{showPopup && <OptionsPopup menu={menu} selectedOptions={options} onSet={setNewOption}/>}
		</div>
	);
}