import * as rk from 'i18n!IntegrationButtons';

import {default as CRMBaseForm} from 'IntegrationButtons/Connectors/AmoCrm/CRMBaseForm';
import {IFormOptions} from 'IntegrationButtons/Integrations/AccountingSystems/Form';
import {IConnectionData} from 'IntegrationButtons/Core/Connection';

export default class Form extends CRMBaseForm {
    protected _defaultConnectionData: IConnectionData = {
        name: 'Megaplan',
        service: 'Megaplan',
        subsystem: '',
        version: 1,
        Data: {name_connector: 'Megaplan'},
        new: true
    };

    protected _beforeMount(options: IFormOptions): void {
        super._beforeMount(options);
        this._templateWizard = 'IntegrationButtons/Connectors/Megaplan/Wizard/Form';
        this._templateSettings = 'IntegrationButtons/Connectors/Megaplan/AdditionalSettings';
        this._indicatorMessage = rk('Подключение к Мегаплан') + '...';
        this._systemName = 'Мегаплан';
    }
}
