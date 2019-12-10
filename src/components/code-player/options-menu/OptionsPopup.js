import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function OptionsPopup(props) {
	const [current, setCurrent] = useState(props.menu);
	function goBack() {
		setCurrent(current.parent);
	}
	function goForward(item) {
		if (item.items) {
			item.parent = current;
			setCurrent(item);
		} else {
			props.onSet(item);
		}
	}
	const selectedOptions = props.selectedOptions;
	return (
		<ul className='unk-code-playa-options-popup'>
			{current && current.parent && <li className='unk-code-playa-options-popup__item' onClick={goBack}>
				 <span className='unk-code-playa-options-popup__item-icon'>&lt;</span>{current.component}
			</li>}
			{current && current.parent && <hr/>}
			{(current.items || []).map((item, i) => {
				let classList = ['unk-code-playa-options-popup__item'];
				if (item.key && selectedOptions[item.key] === item.value) {
					classList.push('unk-code-playa-options-popup__item--selected');
				}
				return (
					<li key={i} className={classList.join(' ')} onClick={goForward.bind(null, item)}>
						{item.component}
						{item && item.items && item.items.length && <span className='unk-code-playa-options-popup__item-next-icon'>&gt;</span>}
					</li>
				);
			}
			)}
		</ul>
	);
}

OptionsPopup.propTypes = {
	menu: PropTypes.shape({
		items: PropTypes.arrayOf(PropTypes.shape({
			component: PropTypes.element
		}))
	}),
	onSet: PropTypes.func
};