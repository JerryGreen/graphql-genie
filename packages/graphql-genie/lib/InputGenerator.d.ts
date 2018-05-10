import { GraphQLInputType, GraphQLNamedType, GraphQLSchema, IntrospectionType } from 'graphql';
import { GenerateConfig } from './GraphQLGenieInterfaces';
import { Relations } from './TypeGeneratorUtils';
export declare class InputGenerator {
    private type;
    private config;
    private currInputObjectTypes;
    private schemaInfo;
    private schema;
    private relations;
    private nestedGenerators;
    private dummy;
    constructor($type: GraphQLNamedType, $config: GenerateConfig, $currInputObjectTypes: Map<string, GraphQLInputType>, $schemaInfo: IntrospectionType[], $schema: GraphQLSchema, $relations: Relations, $dummy?: boolean);
    private handleNestedGenerators();
    private generateInputTypeForField(field, manyWithout, oneWithout, many, one);
    private generateInputTypeForFieldInfo(field, mutation);
    private generateFieldForInput;
    generateWhereUniqueInput(fieldType?: GraphQLNamedType): GraphQLInputType;
    private getFilterInput(typeName, fields, existsFields, matchFields, rangeFields, addLogicalOperators);
    generateFilterInput(addLogicalOperators: boolean, fieldType?: GraphQLNamedType): GraphQLInputType;
    generateOrderByInput(fieldType?: GraphQLNamedType): GraphQLInputType;
    generateCreateWithoutInput(fieldType?: GraphQLNamedType, relationFieldName?: string): GraphQLInputType;
    generateCreateManyWithoutInput(fieldType: GraphQLNamedType, relationFieldName: string): GraphQLInputType;
    generateCreateOneWithoutInput(fieldType: GraphQLNamedType, relationFieldName: string): GraphQLInputType;
    generateCreateManyInput(fieldType: GraphQLNamedType): GraphQLInputType;
    generateCreateOneInput(fieldType: GraphQLNamedType): GraphQLInputType;
    generateCreateInput(): GraphQLInputType;
    generateUpdateWithoutInput(fieldType: GraphQLNamedType, relationFieldName?: string): GraphQLInputType;
    generateUpdateWithWhereUniqueWithoutInput(fieldType: GraphQLNamedType, relationFieldName?: string): GraphQLInputType;
    generateUpdateManyWithoutInput(fieldType: GraphQLNamedType, relationFieldName: string): GraphQLInputType;
    generateUpdateOneWithoutInput(fieldType: GraphQLNamedType, relationFieldName: string): GraphQLInputType;
    generateUpdateManyInput(fieldType: GraphQLNamedType): GraphQLInputType;
    generateUpdateOneInput(fieldType: GraphQLNamedType): GraphQLInputType;
    generateUpdateInput(): GraphQLInputType;
    generateUpsertWithoutInput(fieldType: GraphQLNamedType, relationFieldName?: string): GraphQLInputType;
    generateUpsertWithWhereUniqueWithoutInput(fieldType: GraphQLNamedType, relationFieldName?: string): GraphQLInputType;
}
