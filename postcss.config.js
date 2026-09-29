const FONT_SIZE_SCALE = 1.5;
const processedDeclarations = new WeakSet();

const scaleFontSize = {
  postcssPlugin: "erp-font-size-scale",
  Declaration(declaration) {
    if (processedDeclarations.has(declaration)) return;
    if (declaration.prop !== "font-size") return;

    const selector = declaration.parent?.selector || "";
    if (selector.includes("material-symbols-outlined")) return;

    const value = declaration.value.trim();
    if (!value || /^(inherit|initial|revert|revert-layer|unset|larger|smaller)$/i.test(value)) {
      return;
    }

    processedDeclarations.add(declaration);
    declaration.value = `calc((${value}) * ${FONT_SIZE_SCALE})`;
  },
};

export default {
  plugins: [scaleFontSize],
};
