export const NominalToken = Symbol("NominalToken");
export type ReverseNominal<Data> = Omit<Data, typeof NominalToken>;
export type Nominal<
  Token extends string | symbol,
  Data extends Record<any, any>
> = Readonly<Data> & {
  readonly [NominalToken]: Token;
};

export const Nominal = <
  Token extends string | symbol,
  Data extends Record<any, any>
>(
  data: Data,
  token: Token
) => {
  return {
    ...data,
    [NominalToken]: token,
  } as Nominal<Token, typeof data>;
};

export const getNominalToken = <
  T extends Nominal<string | symbol, Record<any, any>>
>(
  value: T
) => {
  return value[NominalToken];
};

export type NominalFactory<Token extends string | symbol, Data> = {
  _construct: (
    data: ReverseNominal<Data>
  ) => Readonly<Nominal<Token, ReverseNominal<Data>>>;
  match: (value: any) => value is Nominal<Token, ReverseNominal<Data>>;
  token: Token;
};

export const NominalFactory = <
  Data extends Nominal<any, any>,
  Token extends string | symbol = Data[typeof NominalToken]
>(
  token: Token
): NominalFactory<Token, Data> => {
  const _construct = (
    data: ReverseNominal<Data>
  ): Nominal<Token, ReverseNominal<Data>> => {
    return Nominal(data, token);
  };

  return {
    _construct,
    match: (value: any): value is Nominal<Token, ReverseNominal<Data>> => {
      return value[NominalToken] === token;
    },
    token,
  };
};
