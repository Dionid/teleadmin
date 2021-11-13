export type Branded<T, Brand> = T & Brand;
type Primitive =
  | string
  | number
  | boolean
  | Date
  | string[]
  | number[]
  | boolean[]
  | Date[]
  | null
  | Buffer;
export type BrandedPrimitive<Type extends Primitive, Brand> = Branded<
  Type,
  Brand
>;
