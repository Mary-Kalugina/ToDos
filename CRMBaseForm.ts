import * as template from 'wml!IntegrationButtons/Connectors/AmoCrm/CRMBaseForm/CRMBaseForm';

import {TemplateFunction} from 'UI/Base';
import {SyntheticEvent} from 'UICommon/Events';
import {Model} from 'Types/entity';

import {Form as BaseForm, IFormOptions} from 'IntegrationButtons/Integrations/AccountingSystems/Form';
import {Connector} from 'IntegrationButtons/Connectors/AmoCrm/Connector';
import {Memory} from 'Types/source';
import {Connection} from 'IntegrationButtons/Core/Connection';
import {IBaseFormOptions} from 'IntegrationButtons/Integrations/BaseForm';
import ExtException from "IntegrationButtons/Core/ExtException";

import 'css!IntegrationButtons/Integrations/AccountingSystems/Form';

enum STATUS {
    processing,
    connected = 1,
    disconnected = 2w
}

interface FormIBaseFormOptions extends IBaseFormOptions {
    connection: Connection;
}

export default class CRMBaseForm extends BaseForm {
    protected _template: TemplateFunction = template;
    protected _connection: Connection;
    protected _autoSyncChange: boolean = false;
    protected _source: Memory;
    protected _statusConnection: STATUS;
    protected _connector: Connector;
    protected _isAutoSync: boolean;
    protected _options: FormIBaseFormOptions;
    protected _userName: string;
    protected _nameWasEdited: boolean = false;
    /** URL-расположение папки с пошаговым мастером */
    protected _templateWizard: string;
    /** Шаблон настроек CRM-системы */
    protected _templateSettings: string;
    /** Сообщение, отображаемое индикатором */
    protected _indicatorMessage: string;
    /** Название CRM-системы в блоке с подсказкой */
    protected _systemName: string;

    /**
     * Обработчик изменения автоматической синхронизации подключения
     */
    protected _changeIsAutoSync(event: SyntheticEvent<Event>, isAutoSync: boolean): void {
        this._autoSyncChange = isAutoSync;
        this._connection.sync = isAutoSync;
        this._autoSyncChange = true;
    }

    protected async saveIntegration(): Promise<boolean | [boolean, boolean, string]> {
        const result: boolean | [boolean, boolean, string] = await super.saveIntegration();
        if (result && Array.isArray(result) && result[2] && !this._parentConnection.new) {
            this._connection.name = this._parentConnection.name;
            await this._connection.write();
        }
        return result;
    }

    protected async _startSyncNow(): Promise<void> {
        this._connector = await this._connection.changeConnector() as Connector;

        await this._connector.startSyncNow();
    }

    protected async _beforeMount(options: IFormOptions): Promise<void> {
        super._beforeMount(options);
    }

    protected async _afterMount(options: IFormOptions): Promise<void> {
        await this._initForm();
    }

    /**
     * Инициализация формы интеграции
     * @protected
     */
    protected async initForm(options: IFormOptions): Promise<void> {
        try {
            await super.initForm(options);
            this._isAutoSync = this._connection.sync;
        } catch (err) {
            throw new ExtException({action: 'initForm', parent: err});
        }
    }

    protected async isFormChanged(): Promise<boolean> {
        if (this._parentConnection.new || this._nameWasEdited || this._autoSyncChange) {
            return true;
        }
        return false;
    }

    protected async _beforeUpdate(options: IFormOptions): Promise<void> {
        if (options) {
            if (options.id !== this._options.id) {
                this._nameWasEdited = false;
            }
            await super._beforeUpdate(options);
        }
    }

    protected _setName(event: SyntheticEvent, name: string): void {
        this._nameWasEdited = true;
        return super.setName(event, name);
    }

    protected async _beforeEndEdit(event: unknown, item: Model, willSave: boolean, isAdd: boolean): Promise<void> {
        await super.saveCard();
    }

    protected async _addTimetable(template: string, countStep?: number): Promise<void> {
        super._createChildrenConnection();
        const waitPromise = new Promise(async resolve => {
            const connector = await this._connection.getConnector() as Connector;
            const result: boolean = await connector.connect();
            if (result) {
                await this._connection.write();
            }
            await this.updateChildrenConnection();
            resolve(true);
        });
        this._children.loadingIndicator.show({}, waitPromise);
    }

    protected async _initForm(): Promise<void> {
        await this.updateChildrenConnection();
        if (this._connections.data.length) {
            this._connection = new Connection().initByData(this._connections.data[0]);
            this._isAutoSync = this._connection.sync;
        } else {
            super._createChildrenConnection();
            const waitPromise = new Promise(async resolve => {
                this._connector = await this._connection.getConnector() as Connector;
                const result: boolean = await this._connector.connect();
                if (result) {
                    await this._connection.write();
                }
                resolve(true);
            });
            this._children.loadingIndicator.show({}, waitPromise);
        }
        this._userName = await this._connection.getUserName();
        // ToDo: в будущем нужно во все уже созданные интеграции добавить connectionParam
        if (!this._connection.data.connectionParam) {
            this._connection.data.connectionParam = {};
        }
    }

    protected async updateForm(): Promise<void> {
        await super.updateForm();
        await this._initForm();
    }
}
