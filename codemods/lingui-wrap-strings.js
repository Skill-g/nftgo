// @ts-nocheck
module.exports = function transform(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

    const VISIBLE_PROPS = new Set([
        'title','label','aria-label','placeholder','alt','helperText',
        'emptyText','heading','subtitle','caption','tooltip','buttonText'
    ]);

    const isStringLiteral = (n) =>
        (n && n.type === 'Literal' && typeof n.value === 'string') ||
        (n && n.type === 'StringLiteral' && typeof n.value === 'string');

    const getString = (n) =>
        n.type === 'Literal' ? n.value :
            n.type === 'StringLiteral' ? n.value :
                undefined;

    const isTransName = (nameNode) => {
        if (!nameNode) return false;
        if (nameNode.type === 'JSXIdentifier') return nameNode.name === 'Trans';
        if (nameNode.type === 'Identifier') return nameNode.name === 'Trans';
        return false;
    };

    const isInsideTrans = (path) => {
        let p = path.parentPath;
        while (p) {
            const v = p.value;
            if (v && v.type === 'JSXElement') {
                if (isTransName(v.openingElement && v.openingElement.name)) return true;
            }
            p = p.parentPath;
        }
        return false;
    };

    const alreadyTaggedWithT = (attrVal) => {
        if (attrVal?.type !== 'JSXExpressionContainer') return false;
        const e = attrVal.expression;
        if (!e) return false;
        if (e.type === 'TaggedTemplateExpression' && e.tag?.type === 'Identifier' && e.tag.name === 't') return true;
        if (e.type === 'CallExpression' && e.callee?.type === 'Identifier' && e.callee.name === 't') return true;
        return false;
    };

    const looksLikeHumanText = (s) => {
        if (!s) return false;
        const trimmed = s.replace(/\s+/g, ' ').trim();
        if (!trimmed) return false;
        if (/^[(){}\[\],.;:!?«»"'\-\u2014…]+$/.test(trimmed)) return false;
        return /[^\x00-\x7F]/.test(trimmed) || /[A-Za-zА-Яа-я]/.test(trimmed) || /\s/.test(trimmed);
    };

    function ensureImport() {
        const imp = root.find(j.ImportDeclaration, { source: { value: '@lingui/macro' } });
        if (imp.size() === 0) {
            root.get().node.program.body.unshift(
                j.importDeclaration(
                    [j.importSpecifier(j.identifier('Trans')), j.importSpecifier(j.identifier('t'))],
                    j.literal('@lingui/macro')
                )
            );
            return;
        }
        imp.forEach(p => {
            const spec = p.node.specifiers || [];
            const hasTrans = spec.some(s => s.imported && s.imported.name === 'Trans');
            const hasT = spec.some(s => s.imported && s.imported.name === 't');
            if (!hasTrans) spec.push(j.importSpecifier(j.identifier('Trans')));
            if (!hasT) spec.push(j.importSpecifier(j.identifier('t')));
            p.node.specifiers = spec;
        });
    }

    const nonEmpty = (n) => !(n.type === 'JSXText' && (!n.value || !n.value.trim()));

    let changed = false;

    function collapseNestedTransOnce() {
        let touched = false;
        root.find(j.JSXElement, {
            openingElement: { name: { type: 'JSXIdentifier', name: 'Trans' } }
        }).forEach(path => {
            const children = (path.node.children || []).filter(nonEmpty);
            if (children.length === 1) {
                const only = children[0];
                if (only.type === 'JSXElement' && isTransName(only.openingElement.name)) {
                    j(path).replaceWith(only);
                    touched = true;
                }
            }
        });
        return touched;
    }
    for (let i = 0; i < 3; i++) {
        if (!collapseNestedTransOnce()) break;
        changed = true;
    }

    root.find(j.JSXText).forEach(path => {
        const raw = path.node.value;
        const text = raw && raw.replace(/\s+/g, ' ').trim();
        if (!looksLikeHumanText(text)) return;
        if (isInsideTrans(path)) return;

        const transEl = j.jsxElement(
            j.jsxOpeningElement(j.jsxIdentifier('Trans'), []),
            j.jsxClosingElement(j.jsxIdentifier('Trans')),
            [j.jsxText(text)]
        );
        j(path).replaceWith(transEl);
        changed = true;
    });

    root.find(j.JSXAttribute).forEach(path => {
        const name = path.node.name && path.node.name.name;
        if (!name || !VISIBLE_PROPS.has(String(name))) return;

        const val = path.node.value;
        if (!val) return;
        if (alreadyTaggedWithT(val)) return;

        const makeTagged = (s) =>
            j.jsxExpressionContainer(
                j.taggedTemplateExpression(
                    j.identifier('t'),
                    j.templateLiteral([j.templateElement({ raw: s, cooked: s }, true)], [])
                )
            );

        if (isStringLiteral(val)) {
            const s = (getString(val) || '').trim();
            if (!looksLikeHumanText(s)) return;
            path.node.value = makeTagged(s);
            changed = true;
            return;
        }
        if (val.type === 'JSXExpressionContainer' && isStringLiteral(val.expression)) {
            const s = (getString(val.expression) || '').trim();
            if (!looksLikeHumanText(s)) return;
            path.node.value = makeTagged(s);
            changed = true;
            return;
        }
    });

    if (changed) ensureImport();

    for (let i = 0; i < 3; i++) {
        if (!collapseNestedTransOnce()) break;
        changed = true;
    }

    return changed ? root.toSource({ quote: 'single', reuseWhitespace: false }) : null;
};
