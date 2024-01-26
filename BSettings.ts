import * as template from 'wml!IntegrationButtons/Connectors/Bitrix/AdditionalSettings';

import {TemplateFunction} from 'UI/Base';

import {default as BaseSettings} from 'IntegrationButtons/Connectors/AmoCrm/Settings';

export default class Settings extends BaseSettings {
    protected _template: TemplateFunction = template;
}
