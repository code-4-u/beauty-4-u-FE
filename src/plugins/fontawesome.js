import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import {
    faArrowRightFromBracket,
    faArrowRotateRight,
    faBold,
    faItalic,
    faStrikethrough,
    faBell
} from '@fortawesome/free-solid-svg-icons';

import {
    faTrashCan,
    faPenToSquare
} from '@fortawesome/free-regular-svg-icons';

const icons = [
    faArrowRightFromBracket,
    faTrashCan,
    faPenToSquare,
    faArrowRotateRight,
    faBold,
    faItalic,
    faStrikethrough,
    faBell
];

icons.forEach(icon => library.add(icon))

export function setupFontAwesome(app) {
    app.component('font-awesome-icon', FontAwesomeIcon)
}