import { IntrospectionType } from 'graphql';
import { Connection, DataResolver, Features, FortuneOptions } from './GraphQLGenieInterfaces';
export default class FortuneGraph implements DataResolver {
    private fortuneOptions;
    private fortuneTypeNames;
    private uniqueIndexes;
    private schemaInfo;
    private store;
    constructor(fortuneOptions: FortuneOptions, schemaInfo: IntrospectionType[]);
    getValueByUnique: (returnTypeName: string, args: any) => Promise<Object>;
    canAdd: (graphQLTypeName: string, inputRecords: object[]) => Promise<boolean>;
    create: (graphQLTypeName: string, records: any, include?: any, meta?: any) => Promise<any>;
    getConnection: (allEdges: any[], before: string, after: string, first: number, last: number) => Connection;
    private edgesToReturn;
    private applyCursorsToEdges;
    private getDataTypeName(graphQLTypeName);
    find: (graphQLTypeName: string, ids?: string[], options?: any, include?: any, meta?: any) => Promise<any>;
    private generateUpdates;
    update: (graphQLTypeName: string, records: any, meta?: any, options?: object) => Promise<any>;
    delete: (graphQLTypeName: string, ids?: string[], meta?: any) => Promise<boolean>;
    getLink: (graphQLTypeName: string, field: string) => string;
    getStore: () => any;
    private computeFortuneTypeNames;
    getFortuneTypeName: (name: string) => string;
    private buildFortune;
    getFeatures(): Features;
    private generateOptions;
    applyOptions(graphQLTypeName: string, records: any, options: any, meta?: any): any;
}