/**
 * Визуальное представление настроек подключения к API HTTP
 * @kaizen_zone e1ead971-628b-4c71-ba02-608c8dc75832
 */
import * as template from 'wml!IntegrationButtons/Connectors/API/Settings';

import {Control, IControlOptions, TemplateFunction} from 'UI/Base';
import {SyntheticEvent} from 'UICommon/Events';
import {Memory, SbisService} from 'Types/source';
import {merge} from 'Types/object';
import {object} from 'Types/util';
import {date as dateFormatter} from 'Types/formatter';
import {IndicatorOpener} from 'Controls/LoadingIndicator';
import {Container, Controller, IValidateResult} from 'Controls/validate';
import {Selector} from 'Controls/lookup';
import {IItemAction, TItemActionShowType} from 'Controls/itemActions';

import {ColorStyle} from 'IntegrationButtons/Integrations/Templates/CopyConnectionID';
import {IDataParams, IInfoResultRobot, IMainResultRobot} from 'IntegrationButtons/Connectors/API/interfaces';
import {Connection, IConnectionData, list} from 'IntegrationButtons/Core/Connection';
import {isEqual} from 'IntegrationButtons/Core/JsHelper';
import ExtException from 'IntegrationButtons/Core/ExtException';
import Schedule from 'IntegrationButtons/Integrations/Templates/Schedule';

import Service from 'BlocklyIntegration/Service';
import {showNotification} from 'optional!BlocklyEditor/utils';
import {byUrl} from 'IntegrationApp/Check';
import {IService} from 'BlocklyEditor/interface/IService';

import 'css!IntegrationButtons/Connectors/Site1C/Settings';
import 'css!IntegrationButtons/Connectors/API/Settings';
import {Record} from "Types/entity";
import rk from "i18n!*";
import {ICreateOptions} from "IntegrationSettings/ExtAppCard/_card/interfaces";
import {FormControllerSource} from "IntegrationSettings/ExtAppCard/_card/sources";

export interface ISettingsControlOptions extends IControlOptions {
    parentConnection: Connection;
    connection: Connection;
}

enum ENDPOINTS {
    /** запуск ini-шки */
    main = 'main',
    /** получение параметров для ini */
    info = 'info',
}

/**
 * Визуальное представление настроек подключения к API
 * @class IntegrationButtons/Connectors/API/Settings
 * @extends UI/Base:Control
 * @kaizen_zone e1ead971-628b-4c71-ba02-608c8dc75832
 * @public
 */
export default class Settings extends Control<ISettingsControlOptions> {
    protected _record: Record;
    protected _oldRecord: object;
    //#region Инициализация полей
    protected _template: TemplateFunction = template;
    /** Экземпляр дочернего подключения */
    protected _childrenConnection: Connection | null;
    /** Идентификатор выбранного алгоритма */
    protected _idAlgorithm: string | null = null;
    /** Экземпляр подключения Blockly */
    protected _connectionBlockly: IService;
    /** Источник данных для выбора алгоритма Blockly */
    protected _sourceAlgorithm: Memory;
    /** Дата следующего запуска алгоритма */
    protected _nextRun: string = '';
    /** Дата последнего запуска алгоритма */
    protected _lastRun: string = '';
    /** Статус сообщения после выполнения ini-шки */
    protected _statusMsg: string = ''; // ToDo: узнать какие есть статусы и определить enum
    /** Данные в результате запуска ini-шки */
    protected _dataRun: IMainResultRobot['data'] | null;
    /** Список параметров алгоритма */
    protected _listParams: IDataParams;
    /** Признак развернутости содержимого блока "Алгоритм" */
    protected _algorithmExpanded: boolean = false;
    /** Признак развернутости содержимого блока "Параметры" */
    protected _paramsExpanded: boolean = false;
    /** Признак развернутости содержимого блока "Автоматический запуск" */
    protected _automaticStartExpanded: boolean = false;
    /**
     * Признак активации контрола с названием интеграции,
     * используется для отображения border
     */
    protected _isActiveName: boolean = false;
    /** Признак доступности "Автоматического запуска" для проверки на валидацию */
    protected _automaticStartIsCheck: boolean = false;
    /** Признак отображения блоков из редактора Blockly в виде Svg */
    protected _svgPreviewer?: string;
    /** Конфигурация свойств в PropertyGrid */
    protected _typeDescription: object[] = [];
    /** Признак открытия карточки интеграции в стороннем приложении (SAP, 1С) */
    protected _isIntegrationApp: boolean | null;
    /** Стиль цвета идентификатора и кнопки копирования */
    protected _colorStyle: ColorStyle = ColorStyle.Default;
    /** Признак необходимости открытия справочника алгоритмов Blockly */
    protected _needShowSelector: boolean = false;

    protected _userActions: IItemAction[] = [{
        id: 'edit',
        title: 'Редактировать',
        tooltip: 'Редактировать',
        icon: 'icon-Edit',
        showType: TItemActionShowType.TOOLBAR,
        handler: async (item) => {
            await this._editIni(item.get('title'))
        }
    }];
    /** Дочерние элементы контрола */
    protected _children: {
        periodicity: Schedule;
        formController: Controller;
        validateName: Container;
        blocklySelector: Selector;
    };

    //#endregion

    protected async _beforeUpdate(options: ISettingsControlOptions): Promise<void> {
        if (options.parentConnection?.id !== this._options.parentConnection?.id ||
            options.connection?.id !== this._options.connection?.id) {
            this._idAlgorithm = null;
            await this._getSettingsCard(options);
            await this.initForm();
            this._automaticStartExpanded = false;
            this._algorithmExpanded = false;
            this._paramsExpanded = false;
        }
        if (options.readOnly) {
            this._automaticStartIsCheck = false;
        } else {
            this._automaticStartIsCheck = true;
        }
    }

    protected async _beforeMount(options: ISettingsControlOptions): Promise<void> {
        this._onRemoveIniCallback = this._onRemoveIniCallback.bind(this);
        this._onCreateIniCallback = this._onCreateIniCallback.bind(this);
        this._record = new Record({
            rawData: {}
        });
        await this._getSettingsCard(options);
    }
    //
    /**
     * Функция, которая определяет, должно ли показываться окно
     * с подтверждением сохранения/не сохранения измененных данных
     * при закрытии диалога редактирования записи
     * @private
     */
/*    protected _confirmationShowingCallback(): boolean {
        return true;
    }*/

    protected _onConfirmationDialogResult(e: never, answer: boolean | void): void {
        if (answer) {

        }
    }

    haveBeenSettingsChanged(): boolean {
        return this._checkFormChanged();
    }

    protected async _afterMount(): Promise<void> {
        await this.initForm();
    }

    /**
     * Обработчик попытки сохранения новой интеграции
     * @protected
     * @param {SyntheticEvent} _ - дескриптор события
     */
    protected async _trySaveIntegration(_: SyntheticEvent): Promise<void> {
        if (this._options.parentConnection.new) {
            const integrationWasSaved = await this._notify('customSave', [false], {bubbling: true});
            if (integrationWasSaved) {
                this._needShowSelector = true;
            } else {
                this._options.parentConnection.new = true; // ToDo: Убрать в 24.1100
            }
        }
    }

    /**
     * Получение Настроек карточки подключения
     * @protected
     */
    protected async _getSettingsCard(options: ISettingsControlOptions): Promise<void> {
        this._isIntegrationApp = this._isIntegrationApp ? this._isIntegrationApp : byUrl();
        const connection = options.parentConnection || options.connection; // в форме или карточке подключения
        this._record.set('valueParams', {});
        this._childrenConnection = null;
        this._connectionBlockly = null;
        if (!connection) {
            return Promise.reject('Подключение не инициализировано');
        }
        const connections = await list({parent: connection.id});
        if (!connections.length) {
            this._sourceAlgorithm = new Memory({
                data: [],
                keyProperty: 'key'
            });
            return;
        }
        this._childrenConnection = new Connection().initByData(connections[0]);
        this._svgPreviewer = this._childrenConnection.data.blocklySvgPreviewer;
        if (this._childrenConnection.data.public_params) {
            this._idAlgorithm = this._childrenConnection.data.AlgorithmId || this._idAlgorithm;
            this._record.set('valueParams', this._childrenConnection.data.public_params?.algorithm_params);
        }
        const dataBlocklyIni = [];
        if (this._childrenConnection?.id) {
            this._connectionBlockly = new Service(this._childrenConnection?.id);
            const ini = await this._connectionBlockly.algorithmList();
            for (const key in ini) {
                if (ini[key]?.data_name)
                    dataBlocklyIni.push({
                        key,
                        title: ini[key].data_name
                    });
            }
        }
        this._sourceAlgorithm = new Memory({
            data: dataBlocklyIni,
            keyProperty: 'key'
        });
        this._record.set('selectedAlgorithms', this._idAlgorithm ? [this._idAlgorithm] : []);
        if (this._idAlgorithm)
            await this._robotReadParams(this._idAlgorithm);

        this._record.set('automaticStartIsOn', this._childrenConnection?.sync);
        const periodicityParams = await this._childrenConnection.data?.connectionParam;
        this._record.set('periodicity', periodicityParams || {});

        if (this._connectionBlockly) {
            this._nextRun = this._dateToFormat(this._connectionBlockly.Data.NextRun as string);
            this._lastRun = this._dateToFormat(this._connectionBlockly.Data.LastRun as string);
            this._statusMsg = this._connectionBlockly.Data.StatusMsg as string;
        }
        this._dataRun = null;
        if (this._needShowSelector && this._children.blocklySelector) {
            this._needShowSelector = false;
            this._children.blocklySelector.showSelector();
        }
    }

    /**
     * чтение параметров
     * @protected
     * @param {string} ini_name - имя ini файла
     */
    protected async _robotReadParams(ini_name: string): Promise<void> {
        try {
            const robotRunRead = await this._robotRun(ini_name.replace('Blockly_', ''), ENDPOINTS.info);
            this._listParams = robotRunRead?.data?.params;
            this._typeDescription = [];
            if (!this._listParams) {
                return;
            }
            for (const key of Object.keys(this._listParams)) {
                let defaultValue: string | boolean = this._listParams[key].default;
                let value = this._record.get('valueParams')[key];
                switch (this._listParams[key].type) {
                    case 'boolean':
                        defaultValue = this._formatToBoolean(this._listParams[key].default);
                        value = this._formatToBoolean(this._record.get('valueParams')[key]);
                        break;
                    case 'integer':
                        value = Number(this._record.get('valueParams')[key]);
                        break;
                    default:
                        break;
                }
                this._record.get('valueParams')[key] = key in this._record.get('valueParams') ?
                    value : defaultValue;
                this._typeDescription.push({
                    name: key,
                    caption: this._listParams[key].title,
                    type: this._listParams[key].type === 'integer' ? 'number' : this._listParams[key].type,
                    editorOptions: {
                        maxLength: 255,
                        integersLength: 255,
                    },
                });
            }
        } catch (err) {
            throw new ExtException({parent: err});
        }
    }

    /**
     * Преобразует тип данных и возвращает как boolean если он был передан в виде строки ('TRUE')
     * @protected
     * @param {boolean | string} value - значение
     */
    protected _formatToBoolean(value: boolean | string): boolean {
        return typeof value === 'string' ? value === 'TRUE' : value;
    }

    /**
     * Обработчик удаления инишек Blockly, вызывается каждый раз при удалении ini
     * @protected
     * @param {string} idIni - идентификатор удаляемой инишки
     */
    protected async _onRemoveIniCallback(idIni: string): Promise<void> {
        if (this._idAlgorithm === idIni) {
            this._record.set('selectedAlgorithms', null);
            this._idAlgorithm = null;
            if (this._childrenConnection) {
                this._childrenConnection.data.AlgorithmId = undefined;
            }
            await this._getSettingsCard(this._options);
        }
    }

    /**
     * Обработчик редактирования ини
     */
    protected async _editIni(fileName: string): Promise<void> {
        if (!this._connectionBlockly) {
            return;
        }
        try {
            const {openInDialog} = await import('BlocklyIntegration/opener');

            await openInDialog({
                opener: this,
                connection_id: this._connectionBlockly.ConnectionId,
                algorithm: fileName,
                onClose: this._onCloseBlocklyEditor.bind(this),
                onChangeAlgorithmName: this._onChangeAlgorithmName.bind(this),
                onSvgUpdate: this._onSvgUpdate.bind(this)
            });
        } catch (err) {
            showNotification(true, err.message);
        }
    }

    /**
     * Обработчик создания инишек Blockly, вызывается каждый раз при создании нового ini
     * @protected
     * @param {string} idIni - идентификатор создаваемой инишки
     */
    protected async _onCreateIniCallback(idIni: string): Promise<void> {
        await this._editIni(idIni);
    }

    /**
     * Вызов метода API3.RobotRun
     * @protected
     * @param {string} ini_name - имя ini файла
     * @param {ENDPOINTS} endpoint - endpoint для вызова метода API3.RobotRun
     */
    protected async _robotRun(ini_name: string, endpoint: ENDPOINTS): Promise<IInfoResultRobot | IMainResultRobot> {
        if (!this._childrenConnection) {
            return;
        }
        const indication = IndicatorOpener.show({
            delay: 0
        });
        try {
            if (endpoint === ENDPOINTS.main) {
                const connector = await this._childrenConnection.getConnector();
                // const {Guid} = await import('Types/entity');
                // const CustomSlice = await import('LongOperations/Custom/Slice');
                // const uid = Guid.create();
                // const customSlice = new CustomSlice({
                //     id: uid
                // });
                // customSlice.subscribe('onlongoperationended', function(event, param) {
                //
                // });
                // customSlice.unsubscribe();
                await connector.startSyncNow();
            } else {
                const api = new SbisService({
                    endpoint: {
                        address: '/integration_config/service/',
                        contract: 'API3'
                    }
                });
                const result = await api.call('API3.RobotRun', {
                    Data: {
                        connection_uuid: this._childrenConnection.id,
                        ini_name,
                        operation_uuid: '',
                        endpoint
                    }
                });
                return result?.getRawData();
            }
        } finally {
            IndicatorOpener.hide(indication);
        }
    }

    /**
     * Функция приведение к виду 'DD.MM.YY HH:mm' даты
     * @protected
     * @param {string} value - Дата
     */
    protected _dateToFormat(value: string): string {
        if (value) {
            const dateValue = new Date(value);
            return dateFormatter(dateValue, 'DD.MM.YY HH:mm').trim();
        } else {
            return value;
        }
    }

    /**
     * Выбор алгоритма из выпадающего списка
     * @protected
     * @param {string} newIdAlgorithm - выбранный алгоритм
     */
    protected async _selectAlgorithm(newIdAlgorithm: string): Promise<void> {
        this._idAlgorithm = newIdAlgorithm || null;
        if (!this._idAlgorithm) {
            this._record.set('automaticStartIsOn', false);
        }
        if (newIdAlgorithm) {
            await this._robotReadParams(newIdAlgorithm);
        }
    }

    /**
     * Обработчик выбора алгоритма из выпадающего списка
     * @protected
     * @param {SyntheticEvent} _ - дескриптор события
     * @param {string[]} keys - массив выбранных ключей
     */
    protected async _onSelectedAlgorithm(_: SyntheticEvent | null, keys: string[]): Promise<void> {
        await this._selectAlgorithm(keys[0]);
    }

    /**
     * Изменение значений для параметров выбранного алгоритма
     * @protected
     */
    protected _valueHandler(_: SyntheticEvent, key: string, value: string): void {
        this._record.set('valueParams', {...this._record.get('valueParams'), [key]: value});
    }

    /**
     * Обработчик при клике на кнопку запуска алгоритма "Запустить сейчас"
     * @protected
     */
    protected async _runAlgorithm(): Promise<void> {
        if (!this._idAlgorithm) {
            return;
        }
        const result = await this._robotRun(this._idAlgorithm.replace('Blockly_', ''), ENDPOINTS.main) as IMainResultRobot;
        // FixMe: получать результат длительной операции
        this._lastRun = this._dateToFormat(result.begin);
        this._statusMsg = result.status;
        this._dataRun = result.data || null;
    }

    /**
     * Обработчик при клике на редактирование алгоритма
     * @protected
     */
    protected async _editAlgorithm(): Promise<void> {
        if (!this._connectionBlockly || !this._idAlgorithm) {
            return;
        }
        const {openInDialog} = await import('BlocklyIntegration/opener');

        await openInDialog({
            opener: this,
            connection_id: this._connectionBlockly.ConnectionId,
            algorithm: this._idAlgorithm,
            onClose: this._onCloseBlocklyEditor.bind(this),
            onChangeAlgorithmName: this._onChangeAlgorithmName.bind(this),
            onSvgUpdate: this._onSvgUpdate.bind(this),
        });
    }

    protected async _onChangeAlgorithmName(newIni: string): Promise<void> {
        await this._selectAlgorithm(newIni);
    }

    /**
     * Заполнение полей формы данными подключения
     * @protected
     */
    protected _initValueConnection(): void {
        this._record.set('name', this._options.parentConnection?.name || this._options.connection?.name);
        this._record.set('automaticStartIsOn', this._childrenConnection?.sync || false);
        const idAlgorithm = this._childrenConnection?.data?.AlgorithmId;
        if (idAlgorithm && this._sourceAlgorithm.data.length) {
            this._idAlgorithm = this._sourceAlgorithm.data.find((item: { key: string }) => {
                return item.key === idAlgorithm
            })?.key || null;
        } else {
            this._idAlgorithm = null;
        }
        this._record.set('selectedAlgorithms', this._idAlgorithm ? [this._idAlgorithm] : []);
    }

    /**
     * Инициализация формы интеграции
     * @protected
     */
    protected async initForm(): Promise<void> {
        await this._initValueConnection();
        this._oldRecord = JSON.parse(JSON.stringify(this._record.getRawData()));
    }

    /**
     * Установка имени подключения
     * @private
     * @param {SyntheticEvent} _ - дескриптор события
     * @param {string} newName - новое название подключения
     */
    protected _setName(_: SyntheticEvent, newName: string): void {
        this._record.set('name', newName);
        this._notify('setName', [newName]);
    }

    /**
     * Установка имени подключения
     * @private
     * @param {SyntheticEvent} _ - дескриптор события
     * @param {boolean} isActivated - активность контрола
     */
    protected _activatedName(_: SyntheticEvent, isActivated: boolean): void {
        this._isActiveName = isActivated && !this._options.readOnly;
    }

    /**
     * Обработчик наличия изменений в карточке интеграции
     */
    async isFormChanged(): Promise<boolean> {
        return this._checkFormChanged();
    }

    protected _checkFormChanged(): boolean {
        try {
            if (this._options.parentConnection.new) {
                return true;
            }
            if (!this._options.parentConnection || !this.isRecordChanged()) {
                return false;
            }
            return this.isRecordChanged();
        } catch (err) {
            throw new ExtException({action: 'API.checkFormChanged', parent: err});
        }
    }

    protected isRecordChanged(): boolean {
        return !isEqual(this._record.getRawData(), this._oldRecord);
    }

    /**
     * Установка на подключение интеграции данных с формы
     * @protected
     */
    protected setDataConnection(): void {
        if (this._options.parentConnection && this._options.parentConnection.name !== this._record.get('name')) {
            this._options.parentConnection.new = false; // ToDo: Убрать в 24.1100
            this._options.parentConnection.name = this._record.get('name');
        }
    }

    /**
     * Валидация заполнения времени для Автоматического запуска
     * @protected
     */
    protected async _validatePeriodicity(): Promise<boolean> {
        let result = false;
        if (this._children.periodicity)
            result = this._children.periodicity.validate();
        return result;
    }

    /**
     * Обработчик перед вызовом сохранения карточки интеграции
     */
    async beforeSaveCard(): Promise<boolean> {
        const validatePeriodicity = await this._validatePeriodicity();
        if (validatePeriodicity === true) {
            this._automaticStartExpanded = true;
            return false;
        }
        const validateName: unknown = await this._children.validateName.validate();
        return validateName === null;
    }

    /**
     * Обработчик после сохранения интеграции
     * @protected
     */
    protected async afterSaveCard(): Promise<void> {
        const isFirstSave = await this._saveParams();
        if (isFirstSave)
            await this._getSettingsCard(this._options);
    }

    /**
     * Сохранение параметров Алгоритма для connection
     * @protected
     * @param {Connection} connection - экземпляр подключения
     */
    protected async _saveParamsAlgorithm(connection: Connection): Promise<void> {
        // const connection = new Connection(connectionId);
        // await connection.read();
        // connection.data.public_params = {
        //     algorithm_name: this._idAlgorithm,
        //     algorithm_params: this._valueParams
        // };
        connection.data.AlgorithmId = this._idAlgorithm || undefined;
        // в AlgorithmTitle пока временно кладем тоже что и в AlgorithmId
        connection.data.AlgorithmTitle = this._idAlgorithm || undefined;
        connection.data.public_params = {
            algorithm_params: this._record.get('valueParams')
        };
        connection.sync = this._record.get('automaticStartIsOn');
        connection.data.connectionParam = this._record.get('automaticStartIsOn') ? this._record.get('periodicity') : {};
        await connection.write();
    }

    /**
     * Сохранение параметров подключения
     * @protected
     */
    protected async _saveParams(): Promise<boolean> {
        let isFirstSave = false;
        if (!this._childrenConnection) {
            this._childrenConnection = new Connection();
            const dataChildren: IConnectionData = merge({}, this._options.parentConnection.toJSON());
            dataChildren.id = this._childrenConnection.id;
            dataChildren.parent = this._options.parentConnection.id;
            this._childrenConnection.initByData(dataChildren);
            await this._childrenConnection.write();
            isFirstSave = true;
        }
        await this._saveParamsAlgorithm(this._childrenConnection);
        return isFirstSave;
    }

    /**
     * Запуск валидации элементов формы
     */
    async validate(): Promise<boolean> {
        this.setDataConnection();
        try {
            const valid: Error | IValidateResult = await this._children.formController.submit();
            return !valid || valid instanceof Error || !valid.hasErrors;
        } catch (error) {
            return false;
        }
    }

    /**
     * Обработчик ошибки сохранения интеграции
     * @protected
     */
    protected async errorSaveCard(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Переключение значения Автоматического запуска
     * @protected
     * @param {SyntheticEvent} _ - дескриптор события
     * @param {boolean} value - активность контрола
     */
    protected _valueChanged(_: SyntheticEvent, value: boolean): void {
        this._automaticStartExpanded = value;
    }

    /**
     * Закрытие окна редактора блокли
     * @protected
     */
    protected async _onCloseBlocklyEditor(): Promise<void> {
        await this._getSettingsCard(this._options);
    }

    /**
     * Обработчик изменения отображаемого алгоритма
     * @protected
     */
    protected _onSvgUpdate(newSvg: string): void {
        this._svgPreviewer = newSvg;
    }
}
