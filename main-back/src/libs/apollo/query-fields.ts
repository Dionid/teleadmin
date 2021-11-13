import { FieldNode, SelectionSetNode } from "graphql/language/ast";

export type ParsedSelectionSet = {
  [key: string]: { value: string; subFields?: ParsedSelectionSet };
};

export const parseSelectionSet = (
  selectionSet: SelectionSetNode
): ParsedSelectionSet => {
  return selectionSet.selections.reduce<ParsedSelectionSet>(
    (obj, selection) => {
      if (selection.kind === "Field") {
        obj[selection.name.value] = {
          value: selection.name.value,
        };

        if (selection.selectionSet) {
          obj[selection.name.value] = {
            ...obj[selection.name.value],
            subFields: parseSelectionSet(selection.selectionSet),
          };
        }
      }

      return obj;
    },
    {}
  );
};

export const getQueryFields = (fieldNodes: readonly FieldNode[]) => {
  return fieldNodes.reduce<ParsedSelectionSet>((obj, node) => {
    if (node.selectionSet) {
      return parseSelectionSet(node.selectionSet);
    }

    return obj;
  }, {});
};
