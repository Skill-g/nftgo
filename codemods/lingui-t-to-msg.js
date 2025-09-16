// @ts-nocheck

module.exports = function transform(file, api) {
    const j = api.jscodeshift
    const root = j(file.source)

    const hasUseClient = () =>
        root.find(j.ExpressionStatement, { expression: { type: 'Literal', value: 'use client' } }).size() > 0 ||
        root.find(j.ExpressionStatement, { expression: { type: 'StringLiteral', value: 'use client' } }).size() > 0

    const addUseClient = () => {
        if (hasUseClient()) return
        const first = root.get().node.program.body[0]
        const stmt = j.expressionStatement(j.literal('use client'))
        if (first) {
            root.get().node.program.body.unshift(stmt)
        } else {
            root.get().node.program.body.push(stmt)
        }
    }

    const ensureImportMacroMsg = () => {
        const decls = root.find(j.ImportDeclaration, { source: { value: '@lingui/macro' } })
        if (decls.size() === 0) {
            root.get().node.program.body.unshift(
                j.importDeclaration([j.importSpecifier(j.identifier('msg'))], j.literal('@lingui/macro'))
            )
            return
        }
        decls.forEach(path => {
            const specs = path.node.specifiers || []
            const hasMsg = specs.some(s => s.imported && s.imported.name === 'msg')
            if (!hasMsg) specs.push(j.importSpecifier(j.identifier('msg')))
            path.node.specifiers = specs
        })
    }

    const ensureImportUseLingui = () => {
        const decls = root.find(j.ImportDeclaration, { source: { value: '@lingui/react' } })
        if (decls.size() === 0) {
            root.get().node.program.body.unshift(
                j.importDeclaration([j.importSpecifier(j.identifier('useLingui'))], j.literal('@lingui/react'))
            )
            return
        }
        decls.forEach(path => {
            const specs = path.node.specifiers || []
            const hasHook = specs.some(s => s.imported && s.imported.name === 'useLingui')
            if (!hasHook) specs.push(j.importSpecifier(j.identifier('useLingui')))
            path.node.specifiers = specs
        })
    }

    const isInsideTrans = (path) => {
        let p = path.parentPath
        while (p) {
            const v = p.value
            if (v && v.type === 'JSXElement') {
                const name = v.openingElement && v.openingElement.name
                if (name && ((name.type === 'JSXIdentifier' && name.name === 'Trans') ||
                    (name.type === 'Identifier' && name.name === 'Trans'))) {
                    return true
                }
            }
            p = p.parentPath
        }
        return false
    }

    const getEnclosingFunction = (path) => {
        let p = path
        while (p) {
            const n = p.value
            if (
                n &&
                (n.type === 'FunctionDeclaration' ||
                    n.type === 'FunctionExpression' ||
                    n.type === 'ArrowFunctionExpression')
            ) {
                return p
            }
            p = p.parentPath
        }
        return null
    }

    const ensureUseLinguiInFunction = (fnPath) => {
        const n = fnPath.value
        if (n.type === 'ArrowFunctionExpression' && n.body && n.body.type !== 'BlockStatement') {
            n.body = j.blockStatement([j.returnStatement(n.body)])
        }
        const body = (n.body && n.body.type === 'BlockStatement') ? n.body.body : null
        if (!body) return

        const hasI18nDecl =
            j(fnPath).find(j.VariableDeclarator, {
                id: { type: 'ObjectPattern' },
                init: { callee: { name: 'useLingui' } }
            }).size() > 0

        if (!hasI18nDecl) {
            body.unshift(
                j.variableDeclaration('const', [
                    j.variableDeclarator(
                        j.objectPattern([
                            j.objectProperty(j.identifier('i18n'), j.identifier('i18n'), false, true),
                        ]),
                        j.callExpression(j.identifier('useLingui'), [])
                    ),
                ])
            )
        }
    }

    let changed = false
    const functionsNeedingHook = new Set()

    root.find(j.TaggedTemplateExpression, { tag: { type: 'Identifier', name: 't' } })
        .forEach(path => {
            if (isInsideTrans(path)) return
            const fn = getEnclosingFunction(path)
            if (fn) functionsNeedingHook.add(fn)

            const quasi = path.node.quasi
            const call = j.callExpression(
                j.memberExpression(j.identifier('i18n'), j.identifier('_')),
                [j.taggedTemplateExpression(j.identifier('msg'), quasi)]
            )
            j(path).replaceWith(call)
            changed = true
        })

    root.find(j.CallExpression, { callee: { type: 'Identifier', name: 't' } })
        .forEach(path => {
            if (isInsideTrans(path)) return
            const args = path.node.arguments || []
            if (args.length !== 1) return
            const a0 = args[0]
            if (a0.type !== 'Literal' && a0.type !== 'StringLiteral') return

            const s = a0.value
            const cooked = typeof s === 'string' ? s : String(s)

            const tpl = j.templateLiteral(
                [j.templateElement({ raw: cooked, cooked }, true)],
                []
            )
            const call = j.callExpression(
                j.memberExpression(j.identifier('i18n'), j.identifier('_')),
                [j.taggedTemplateExpression(j.identifier('msg'), tpl)]
            )

            const fn = getEnclosingFunction(path)
            if (fn) functionsNeedingHook.add(fn)

            j(path).replaceWith(call)
            changed = true
        })

    if (!changed) return null

    for (const fnPath of functionsNeedingHook) {
        ensureUseLinguiInFunction(fnPath)
    }

    ensureImportMacroMsg()
    ensureImportUseLingui()
    addUseClient()

    return root.toSource({ quote: 'single', reuseWhitespace: false })
}
