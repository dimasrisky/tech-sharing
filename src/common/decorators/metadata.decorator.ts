import 'reflect-metadata';

export function Relation() {
  return (target: any, propertyKey: string) => {
    const relations = Reflect.getMetadata('relations', target) || [];
    Reflect.defineMetadata('relations', [...relations, propertyKey], target);
  };
}
