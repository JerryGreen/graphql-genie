var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fortune from 'fortune';
import { each, findIndex, forOwn, get, isArray, isEmpty, isEqual, isString, keys, set } from 'lodash';
import fortuneCommon from '../node_modules/fortune/lib/adapter/adapters/common';
import { Connection } from './GraphQLGenieInterfaces';
import { computeRelations } from './TypeGeneratorUtils';
export default class FortuneGraph {
    constructor(fortuneOptions, schemaInfo) {
        this.getValueByUnique = (returnTypeName, args) => __awaiter(this, void 0, void 0, function* () {
            let currValue;
            // tslint:disable-next-line:prefer-conditional-expression
            if (args.id) {
                currValue = yield this.find(returnTypeName, [args.id]);
            }
            else {
                currValue = yield this.find(returnTypeName, undefined, { match: args });
            }
            return isArray(currValue) ? currValue[0] : currValue;
        });
        this.canAdd = (graphQLTypeName, inputRecords) => __awaiter(this, void 0, void 0, function* () {
            let canAdd = true;
            if (inputRecords && this.uniqueIndexes.has(graphQLTypeName)) {
                yield Promise.all(this.uniqueIndexes.get(graphQLTypeName).map((fieldName) => __awaiter(this, void 0, void 0, function* () {
                    yield Promise.all(inputRecords.map((inputRecord) => __awaiter(this, void 0, void 0, function* () {
                        if (canAdd && inputRecord[fieldName]) {
                            const dbRecord = yield this.getValueByUnique(graphQLTypeName, { [fieldName]: inputRecord[fieldName] });
                            if (dbRecord) {
                                canAdd = false;
                            }
                        }
                    })));
                })));
            }
            return canAdd;
        });
        this.create = (graphQLTypeName, records, include, meta) => __awaiter(this, void 0, void 0, function* () {
            const fortuneType = this.getFortuneTypeName(graphQLTypeName);
            records['__typename'] = graphQLTypeName;
            let results = yield this.store.create(fortuneType, records, include, meta);
            results = results.payload.records;
            return isArray(records) ? results : results[0];
        });
        this.getConnection = (allEdges, before, after, first, last) => {
            const connection = new Connection();
            const edgesWithCursorApplied = this.applyCursorsToEdges(allEdges, before, after);
            connection.aggregate.count = allEdges.length;
            connection.edges = this.edgesToReturn(edgesWithCursorApplied, first, last);
            if (typeof last !== 'undefined') {
                if (edgesWithCursorApplied.length > last) {
                    connection.pageInfo.hasPreviousPage = true;
                }
            }
            else if (typeof after !== 'undefined' && get(allEdges, '[0].id', 'id0') !== get(edgesWithCursorApplied, '[0].id', 'id1')) {
                connection.pageInfo.hasPreviousPage = true;
            }
            if (typeof first !== 'undefined') {
                if (edgesWithCursorApplied.length > first) {
                    connection.pageInfo.hasNextPage = true;
                }
            }
            else if (typeof before !== 'undefined' && get(allEdges, `[${allEdges.length - 1}].id`, 'id0') !== get(edgesWithCursorApplied, `[${edgesWithCursorApplied.length - 1}].id`, 'id1')) {
                connection.pageInfo.hasNextPage = true;
            }
            connection.pageInfo.startCursor = get(connection.edges, '[0].id');
            connection.pageInfo.endCursor = get(connection.edges, `[${connection.edges.length - 1}].id`);
            return connection;
        };
        this.edgesToReturn = (edgesWithCursorApplied, first, last) => {
            if (typeof first !== 'undefined') {
                if (first < 0) {
                    throw new Error('first must be greater than 0');
                }
                else if (edgesWithCursorApplied.length > first) {
                    edgesWithCursorApplied = edgesWithCursorApplied.slice(0, first);
                }
            }
            if (typeof last !== 'undefined') {
                if (last < 0) {
                    throw new Error('first must be greater than 0');
                }
                else if (edgesWithCursorApplied.length > last) {
                    edgesWithCursorApplied = edgesWithCursorApplied.slice(edgesWithCursorApplied.length - last, edgesWithCursorApplied.length);
                }
            }
            return edgesWithCursorApplied;
        };
        this.applyCursorsToEdges = (allEdges, before, after) => {
            let edges = allEdges;
            if (after) {
                const afterEdgeIndex = findIndex(edges, ['id', after]);
                if (afterEdgeIndex > -1) {
                    edges = edges.slice(afterEdgeIndex + 1, edges.length);
                }
            }
            if (before) {
                const beforeEdgeIndex = findIndex(edges, ['id', before]);
                if (beforeEdgeIndex > -1) {
                    edges = edges.slice(0, beforeEdgeIndex);
                }
            }
            return edges;
        };
        this.find = (graphQLTypeName, ids, options, include, meta) => __awaiter(this, void 0, void 0, function* () {
            const fortuneType = this.getFortuneTypeName(graphQLTypeName);
            // pull the id out of the match options
            if (get(options, 'match.id')) {
                ids = get(options, 'match.id');
                delete options.match.id;
            }
            options = this.generateOptions(options, graphQLTypeName, ids);
            const results = yield this.store.find(fortuneType, ids, options, include, meta);
            let graphReturn = results.payload.records;
            if (graphReturn) {
                // if one id sent in we just want to return the value not an array
                graphReturn = ids && ids.length === 1 ? graphReturn[0] : graphReturn;
            }
            if (!graphReturn) {
                console.log('Nothing Found ' + graphQLTypeName + ' ' + JSON.stringify(ids) + ' ' + JSON.stringify(options));
            }
            return graphReturn;
        });
        this.generateUpdates = (record, options = {}) => {
            const updates = { id: record['id'], replace: {}, push: {}, pull: {} };
            for (const argName in record) {
                const arg = record[argName];
                if (argName !== 'id') {
                    if (isArray(arg)) {
                        if (options['pull']) {
                            updates.pull[argName] = arg;
                        }
                        else {
                            updates.push[argName] = arg;
                        }
                    }
                    else {
                        updates.replace[argName] = arg;
                    }
                }
            }
            return updates;
        };
        this.update = (graphQLTypeName, records, meta, options) => __awaiter(this, void 0, void 0, function* () {
            const updates = isArray(records) ? records.map(value => this.generateUpdates(value, options)) : this.generateUpdates(records, options);
            const fortuneType = this.getFortuneTypeName(graphQLTypeName);
            let results = yield this.store.update(fortuneType, updates, meta);
            results = results.payload.records;
            return isArray(records) ? results : results[0];
        });
        this.delete = (graphQLTypeName, ids, meta) => __awaiter(this, void 0, void 0, function* () {
            const fortuneType = this.getFortuneTypeName(graphQLTypeName);
            yield this.store.delete(fortuneType, ids, meta);
            return true;
        });
        this.getLink = (graphQLTypeName, field) => {
            const fortuneType = this.getFortuneTypeName(graphQLTypeName);
            return get(this.store, `recordTypes.${fortuneType}.${field}.link`);
        };
        this.getStore = () => {
            if (!this.store) {
                this.store = this.buildFortune();
            }
            return this.store;
        };
        this.computeFortuneTypeNames = () => {
            this.fortuneTypeNames = new Map();
            each(keys(this.schemaInfo), (typeName) => {
                if (typeName !== 'Node' && !this.fortuneTypeNames.has(typeName)) {
                    const type = this.schemaInfo[typeName];
                    if (!isEmpty(type.possibleTypes)) {
                        const possibleTypes = [type.name];
                        each(type.possibleTypes, possibleType => {
                            if (possibleTypes.indexOf(possibleType.name) < 0) {
                                possibleTypes.push(possibleType.name);
                            }
                            possibleType = this.schemaInfo[possibleType.name];
                            each(possibleType['interfaces'], currInterface => {
                                if (currInterface.name !== 'Node' && currInterface.name !== typeName) {
                                    if (possibleTypes.indexOf(currInterface.name) < 0) {
                                        possibleTypes.push(currInterface.name);
                                    }
                                }
                            });
                            each(possibleType['unions'], currUnion => {
                                if (currUnion.name !== typeName) {
                                    if (possibleTypes.indexOf(currUnion.name) < 0) {
                                        possibleTypes.push(currUnion.name);
                                    }
                                }
                            });
                        });
                        possibleTypes.sort();
                        const fortuneTypeName = possibleTypes.join('_');
                        each(possibleTypes, currTypeName => {
                            this.fortuneTypeNames.set(currTypeName, fortuneTypeName);
                        });
                    }
                }
            });
            return this.fortuneTypeNames;
        };
        this.getFortuneTypeName = (name) => {
            name = this.getDataTypeName(name);
            return this.fortuneTypeNames.has(name) ? this.fortuneTypeNames.get(name) : name;
        };
        this.buildFortune = () => {
            this.computeFortuneTypeNames();
            const relations = computeRelations(this.schemaInfo, this.getFortuneTypeName);
            const fortuneConfig = {};
            forOwn(this.schemaInfo, (type, name) => {
                if (type.kind === 'OBJECT' && name !== 'Query' && name !== 'Mutation' && name !== 'Subscription') {
                    const fields = {};
                    forOwn(type.fields, (field) => {
                        if (field.name !== 'id') {
                            let currType = field.type;
                            let isArray = false;
                            while (currType.kind === 'NON_NULL' || currType.kind === 'LIST') {
                                if (currType.kind === 'LIST') {
                                    isArray = true;
                                }
                                currType = currType.ofType;
                            }
                            if (get(field, 'metadata.unique') === true) {
                                if (isArray) {
                                    console.error('Unique may not work on list types', name, field.name);
                                }
                                if (!this.uniqueIndexes.has(name)) {
                                    this.uniqueIndexes.set(name, []);
                                }
                                this.uniqueIndexes.get(name).push(field.name);
                            }
                            currType = currType.kind === 'ENUM' ? 'String' : currType.name;
                            if (currType === 'ID' || currType === 'String') {
                                currType = String;
                            }
                            else if (currType === 'Int' || currType === 'Float') {
                                currType = Number;
                            }
                            else if (currType === 'Boolean') {
                                currType = Boolean;
                            }
                            else if (currType === 'JSON') {
                                currType = Object;
                            }
                            else if (currType === 'Date' || currType === 'Time' || currType === 'DateTime') {
                                currType = Date;
                            }
                            let inverse;
                            if (isString(currType)) {
                                currType = this.getFortuneTypeName(currType);
                                inverse = relations.getInverseWithoutName(currType, field.name);
                            }
                            currType = isArray ? Array(currType) : currType;
                            if (inverse) {
                                currType = [currType, inverse];
                            }
                            fields[field.name] = currType;
                        }
                        fields['__typename'] = String;
                    });
                    const fortuneName = this.getFortuneTypeName(name);
                    const fortuneConfigForName = fortuneConfig[fortuneName] ? fortuneConfig[fortuneName] : {};
                    each(keys(fields), (fieldName) => {
                        const currType = fortuneConfigForName[fieldName];
                        const newType = fields[fieldName];
                        if (!currType) {
                            fortuneConfigForName[fieldName] = newType;
                        }
                        else {
                            let badSchema = typeof newType !== typeof currType;
                            badSchema = badSchema ? badSchema : !isEqual(fortuneConfigForName[fieldName], fields[fieldName]);
                            if (badSchema) {
                                console.error('Bad schema. Types that share unions/interfaces have fields of the same name but different types. This is not allowed\n', 'fortune type', fortuneName, '\n', 'field name', fieldName, '\n', 'currType', fortuneConfigForName[fieldName], '\n', 'newType', fields[fieldName]);
                            }
                        }
                    });
                    fortuneConfig[fortuneName] = fortuneConfigForName;
                }
            });
            const store = fortune(fortuneConfig, this.fortuneOptions);
            window['store'] = store;
            return store;
        };
        this.generateOptions = (options, graphQLTypeName, ids) => {
            options = options ? Object.assign({}, options) : {};
            // if no ids we need to make sure we only get the necessary typename so that this works with interfaces/unions
            if (graphQLTypeName && (!ids || ids.length < 1)) {
                set(options, 'match.__typename', this.getDataTypeName(graphQLTypeName));
            }
            // make sure sort is boolean rather than enum
            if (options.orderBy) {
                const sort = {};
                for (const fieldName in options.orderBy) {
                    if (options.orderBy[fieldName] === 'ASCENDING' || options.orderBy[fieldName] === 'ASC') {
                        sort[fieldName] = true;
                    }
                    else if (options.orderBy[fieldName] === 'DESCENDING' || options.orderBy[fieldName] === 'DESC') {
                        sort[fieldName] = false;
                    }
                }
                options.sort = sort;
                delete options.orderBy;
            }
            return options;
        };
        this.fortuneOptions = fortuneOptions;
        this.schemaInfo = schemaInfo;
        this.uniqueIndexes = new Map();
        this.store = this.buildFortune();
    }
    getDataTypeName(graphQLTypeName) {
        graphQLTypeName = graphQLTypeName.endsWith('Connection') ? graphQLTypeName.replace(/Connection$/g, '') : graphQLTypeName;
        graphQLTypeName = graphQLTypeName.endsWith('Edge') ? graphQLTypeName.replace(/Edge$/g, '') : graphQLTypeName;
        return graphQLTypeName;
    }
    getFeatures() {
        return this.store.adapter.features;
    }
    applyOptions(graphQLTypeName, records, options, meta) {
        options = this.generateOptions(options);
        const fortuneType = this.getFortuneTypeName(graphQLTypeName);
        return fortuneCommon.applyOptions(this.store.recordTypes[fortuneType], records, options, meta);
    }
}
//# sourceMappingURL=FortuneGraph.js.map