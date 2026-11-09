// node_modules/@lit/reactive-element/css-tag.js
var e = globalThis, t = e.ShadowRoot && (e.ShadyCSS === void 0 || e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, n = Symbol(), r = /* @__PURE__ */ new WeakMap(), i = class {
	constructor(e, t, r) {
		if (this._$cssResult$ = !0, r !== n) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, n = this.t;
		if (t && e === void 0) {
			let t = n !== void 0 && n.length === 1;
			t && (e = r.get(n)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && r.set(n, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, a = (e) => new i(typeof e == "string" ? e : e + "", void 0, n), o = (e, ...t) => new i(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, n), s = (n, r) => {
	if (t) n.adoptedStyleSheets = r.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let t of r) {
		let r = document.createElement("style"), i = e.litNonce;
		i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, n.appendChild(r);
	}
}, c = t ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return a(t);
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: f, getOwnPropertySymbols: p, getPrototypeOf: m } = Object, h = globalThis, ee = h.trustedTypes, te = ee ? ee.emptyScript : "", ne = h.reactiveElementPolyfillSupport, g = (e, t) => e, _ = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? te : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, re = (e, t) => !l(e, t), ie = {
	attribute: !0,
	type: String,
	converter: _,
	reflect: !1,
	useDefault: !1,
	hasChanged: re
};
Symbol.metadata ??= Symbol("metadata"), h.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var v = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = ie) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && u(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = d(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? ie;
	}
	static _$Ei() {
		if (this.hasOwnProperty(g("elementProperties"))) return;
		let e = m(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(g("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(g("properties"))) {
			let e = this.properties, t = [...f(e), ...p(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(c(e));
		} else e !== void 0 && t.push(c(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return s(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? _ : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? _ : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? re)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
v.elementStyles = [], v.shadowRootOptions = { mode: "open" }, v[g("elementProperties")] = /* @__PURE__ */ new Map(), v[g("finalized")] = /* @__PURE__ */ new Map(), ne?.({ ReactiveElement: v }), (h.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
var y = globalThis, ae = (e) => e, b = y.trustedTypes, oe = b ? b.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, se = "$lit$", x = `lit$${Math.random().toFixed(9).slice(2)}$`, S = "?" + x, ce = `<${S}>`, C = document, w = () => C.createComment(""), T = (e) => e === null || typeof e != "object" && typeof e != "function", E = Array.isArray, le = (e) => E(e) || typeof e?.[Symbol.iterator] == "function", D = "[ 	\n\f\r]", O = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ue = /-->/g, de = />/g, k = RegExp(`>|${D}(?:([^\\s"'>=/]+)(${D}*=${D}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), fe = /'/g, pe = /"/g, me = /^(?:script|style|textarea|title)$/i, A = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), j = Symbol.for("lit-noChange"), M = Symbol.for("lit-nothing"), he = /* @__PURE__ */ new WeakMap(), N = C.createTreeWalker(C, 129);
function ge(e, t) {
	if (!E(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return oe === void 0 ? t : oe.createHTML(t);
}
var _e = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = O;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === O ? c[1] === "!--" ? o = ue : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = k) : (me.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = k) : o = de : o === k ? c[0] === ">" ? (o = i ?? O, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? k : c[3] === "\"" ? pe : fe) : o === pe || o === fe ? o = k : o === ue || o === de ? o = O : (o = k, i = void 0);
		let d = o === k && e[t + 1].startsWith("/>") ? " " : "";
		a += o === O ? n + ce : l >= 0 ? (r.push(s), n.slice(0, l) + se + n.slice(l) + x + d) : n + x + (l === -2 ? t : d);
	}
	return [ge(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, P = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = _e(t, n);
		if (this.el = e.createElement(l, r), N.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = N.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(se)) {
					let t = u[o++], n = i.getAttribute(e).split(x), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? ye : r[1] === "?" ? be : r[1] === "@" ? xe : L
					}), i.removeAttribute(e);
				} else e.startsWith(x) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (me.test(i.tagName)) {
					let e = i.textContent.split(x), t = e.length - 1;
					if (t > 0) {
						i.textContent = b ? b.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], w()), N.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], w());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === S) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(x, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += x.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = C.createElement("template");
		return n.innerHTML = e, n;
	}
};
function F(e, t, n = e, r) {
	if (t === j) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = T(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = F(e, i._$AS(e, t.values), i, r)), t;
}
var ve = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? C).importNode(t, !0);
		N.currentNode = r;
		let i = N.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new I(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Se(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = N.nextNode(), a++);
		}
		return N.currentNode = C, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, I = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = M, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = F(this, e, t), T(e) ? e === M || e == null || e === "" ? (this._$AH !== M && this._$AR(), this._$AH = M) : e !== this._$AH && e !== j && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? le(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== M && T(this._$AH) ? this._$AA.nextSibling.data = e : this.T(C.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = P.createElement(ge(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new ve(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = he.get(e.strings);
		return t === void 0 && he.set(e.strings, t = new P(e)), t;
	}
	k(t) {
		E(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(w()), this.O(w()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = ae(e).nextSibling;
			ae(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, L = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = M, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = M;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = F(this, e, t, 0), a = !T(e) || e !== this._$AH && e !== j, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = F(this, r[n + o], t, o), s === j && (s = this._$AH[o]), a ||= !T(s) || s !== this._$AH[o], s === M ? e = M : e !== M && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === M ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, ye = class extends L {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === M ? void 0 : e;
	}
}, be = class extends L {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== M);
	}
}, xe = class extends L {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = F(this, e, t, 0) ?? M) === j) return;
		let n = this._$AH, r = e === M && n !== M || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== M && (n === M || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Se = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		F(this, e);
	}
}, Ce = {
	M: se,
	P: x,
	A: S,
	C: 1,
	L: _e,
	R: ve,
	D: le,
	V: F,
	I,
	H: L,
	N: be,
	U: xe,
	B: ye,
	F: Se
}, we = y.litHtmlPolyfillSupport;
we?.(P, I), (y.litHtmlVersions ??= []).push("3.3.3");
var Te = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new I(t.insertBefore(w(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, R = globalThis, z = class extends v {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Te(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return j;
	}
};
z._$litElement$ = !0, z.finalized = !0, R.litElementHydrateSupport?.({ LitElement: z });
var Ee = R.litElementPolyfillSupport;
Ee?.({ LitElement: z }), (R.litElementVersions ??= []).push("4.2.2");
// node_modules/lit-html/directive.js
var De = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, Oe = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), ke = class {
	constructor(e) {}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AT(e, t, n) {
		this._$Ct = e, this._$AM = t, this._$Ci = n;
	}
	_$AS(e, t) {
		return this.update(e, t);
	}
	update(e, t) {
		return this.render(...t);
	}
}, { I: Ae } = Ce, je = (e) => e, Me = () => document.createComment(""), B = (e, t, n) => {
	let r = e._$AA.parentNode, i = t === void 0 ? e._$AB : t._$AA;
	if (n === void 0) n = new Ae(r.insertBefore(Me(), i), r.insertBefore(Me(), i), e, e.options);
	else {
		let t = n._$AB.nextSibling, a = n._$AM, o = a !== e;
		if (o) {
			let t;
			n._$AQ?.(e), n._$AM = e, n._$AP !== void 0 && (t = e._$AU) !== a._$AU && n._$AP(t);
		}
		if (t !== i || o) {
			let e = n._$AA;
			for (; e !== t;) {
				let t = je(e).nextSibling;
				je(r).insertBefore(e, i), e = t;
			}
		}
	}
	return n;
}, V = (e, t, n = e) => (e._$AI(t, n), e), Ne = {}, Pe = (e, t = Ne) => e._$AH = t, Fe = (e) => e._$AH, H = (e) => {
	e._$AR(), e._$AA.remove();
}, Ie = (e, t, n) => {
	let r = /* @__PURE__ */ new Map();
	for (let i = t; i <= n; i++) r.set(e[i], i);
	return r;
}, Le = Oe(class extends ke {
	constructor(e) {
		if (super(e), e.type !== De.CHILD) throw Error("repeat() can only be used in text expressions");
	}
	dt(e, t, n) {
		let r;
		n === void 0 ? n = t : t !== void 0 && (r = t);
		let i = [], a = [], o = 0;
		for (let t of e) i[o] = r ? r(t, o) : o, a[o] = n(t, o), o++;
		return {
			values: a,
			keys: i
		};
	}
	render(e, t, n) {
		return this.dt(e, t, n).values;
	}
	update(e, [t, n, r]) {
		let i = Fe(e), { values: a, keys: o } = this.dt(t, n, r);
		if (!Array.isArray(i)) return this.ut = o, a;
		let s = this.ut ??= [], c = [], l, u, d = 0, f = i.length - 1, p = 0, m = a.length - 1;
		for (; d <= f && p <= m;) if (i[d] === null) d++;
		else if (i[f] === null) f--;
		else if (s[d] === o[p]) c[p] = V(i[d], a[p]), d++, p++;
		else if (s[f] === o[m]) c[m] = V(i[f], a[m]), f--, m--;
		else if (s[d] === o[m]) c[m] = V(i[d], a[m]), B(e, c[m + 1], i[d]), d++, m--;
		else if (s[f] === o[p]) c[p] = V(i[f], a[p]), B(e, i[d], i[f]), f--, p++;
		else if (l === void 0 && (l = Ie(o, p, m), u = Ie(s, d, f)), l.has(s[d])) {
			if (l.has(s[f])) {
				let t = u.get(o[p]), n = t === void 0 ? null : i[t];
				if (n === null) {
					let t = B(e, i[d]);
					V(t, a[p]), c[p] = t;
				} else c[p] = V(n, a[p]), B(e, i[d], n), i[t] = null;
				p++;
			} else H(i[f]), f--;
		} else H(i[d]), d++;
		for (; p <= m;) {
			let t = B(e, c[m + 1]);
			V(t, a[p]), c[p++] = t;
		}
		for (; d <= f;) {
			let e = i[d++];
			e !== null && H(e);
		}
		return this.ut = o, Pe(e, c), j;
	}
}), Re = (e) => e.split(".")[0], ze = (e) => e !== void 0 && ![
	"unavailable",
	"unknown",
	""
].includes(e), U = (e) => e.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""), W = {
	status: [
		"air_fryer",
		"air_fryer_status",
		"status",
		"cooking_status"
	],
	remaining: [
		"left_time",
		"time_remaining",
		"remaining_time"
	],
	fault: ["fault", "error"],
	target_temperature: [
		"target_temperature",
		"operating_temperature",
		"set_temperature"
	],
	current_temperature: ["current_temperature", "temperature"],
	duration: [
		"target_time",
		"operating_time",
		"cooking_duration",
		"set_time"
	],
	mode: [
		"mode",
		"cooking_mode",
		"program"
	],
	start: ["start_cook", "start_program"],
	pause: ["pause"],
	resume: [
		"resume_cook",
		"resume_cooking",
		"resume"
	],
	stop: ["cancel_cooking", "stop_program"],
	preheat: ["preheat"],
	auto_keep_warm: ["auto_keep_warm"],
	current_keep_warm: ["current_keep_warm"],
	weight: ["cooking_weight"],
	reservation: [
		"reservation_left_time",
		"appoint_time",
		"appoint_time_left"
	],
	measure: ["target_cooking_measure", "food_quanty"],
	texture: ["texture"],
	reminder: ["turn_pot"],
	reminder_config: ["turn_pot_config", "turn_pot_cfg"],
	power: [
		"power",
		"on",
		"switch"
	]
}, Be = {
	status: ["sensor"],
	remaining: ["sensor"],
	fault: ["sensor", "binary_sensor"],
	target_temperature: ["number", "sensor"],
	current_temperature: ["sensor"],
	duration: ["number", "sensor"],
	mode: ["select"],
	start: ["button"],
	pause: ["button"],
	resume: ["button"],
	stop: ["button"],
	preheat: ["switch"],
	auto_keep_warm: ["switch"],
	current_keep_warm: ["switch"],
	weight: ["number"],
	reservation: ["number", "sensor"],
	measure: ["select"],
	texture: ["select"],
	reminder: [
		"sensor",
		"select",
		"binary_sensor"
	],
	reminder_config: ["switch"],
	power: ["switch"]
};
function G(e, t) {
	let n = U(e);
	return n === t || n === `air_fryer_${t}` || n === `airfryer_${t}`;
}
function Ve(e, t, n) {
	if (!Be[t].includes(n)) return [0, "incompatible domain"];
	if (t === "power" && e.platform === "xiaomi_miot" && G(e.translation_key || "", "air_fryer")) return [100, "Miot main power switch"];
	if (W[t].some((t) => G(e.translation_key || "", t))) return [100, "translation key"];
	let r = U(e.unique_id || "");
	if (e.platform === "xiaomi_miot" && W[t].some((e) => r.endsWith(`_air_fryer_${e}`) || r.endsWith(`_airfryer_${e}`))) return [95, "Miot unique ID"];
	let i = U(e.entity_id.split(".").slice(1).join("."));
	return W[t].some((e) => i === e || i.endsWith(`_${e}`)) ? [40, "entity ID suffix (needs override)"] : [0, "no semantic match"];
}
function He(e, t, n) {
	let r = Re(e.entity_id), i = t.states[e.entity_id], a = e.platform === "xiaomi_miot" && n.model === "careli.fryer.maf10a" && (G(e.translation_key || "", "turn_pot") || /(?:^|_)air_fryer_turn_pot$/.test(U(e.unique_id || "")) || /(?:^|_)turn_pot$/.test(U(e.entity_id.split(".")[1] || "")));
	return {
		entity: e,
		state: i,
		domain: r,
		available: r === "button" ? !!i && i.state !== "unavailable" : ze(i?.state),
		writable: [
			"number",
			"select",
			"switch",
			"button"
		].includes(r) && !a,
		score: 0,
		evidence: a ? "MAF10A spec: read-only reminder" : "selected-device entity"
	};
}
function Ue(e, t) {
	return /(?:^|\.)fryer\.|air.?fryer/i.test(e.model || "") ? !0 : t.filter((t) => t.device_id === e.id).map((e) => U(e.translation_key || "")).some((e) => e.startsWith("air_fryer") || e.startsWith("airfryer"));
}
function K(e) {
	return e.devices.filter((t) => Ue(t, e.entities));
}
function q(e, t, n) {
	let r = K(t), i = n.device_id ? t.devices.find((e) => e.id === n.device_id) : r.length === 1 ? r[0] : void 0, a = {
		device: i,
		adapter: "generic",
		bindings: {},
		ambiguous: {},
		extras: [],
		diagnostics: [],
		excluded: [],
		online: !1
	};
	if (!i) return a;
	let o = t.entities.filter((e) => e.device_id === i.id);
	a.adapter = o.some((e) => e.platform === "xiaomi_miot") ? "xiaomi_miot" : "generic";
	let s = o.filter((e) => {
		let t = !!e.disabled_by || !n.include_hidden && !!(e.hidden || e.hidden_by);
		return t && a.excluded.push(e), !t;
	}).map((t) => He(t, e, i));
	for (let e of Object.keys(W)) {
		let t = n.overrides?.[e], r = s.filter((e) => e.entity.entity_category !== "diagnostic").map((n) => {
			let [r, i] = Ve(n.entity, e, n.domain), a = t === n.entity.entity_id && Be[e].includes(n.domain), o = [
				"target_temperature",
				"duration",
				"reservation"
			].includes(e) && n.domain === "number" && r >= 90;
			return {
				...n,
				role: e,
				score: a ? 110 : r + +!!o,
				evidence: a ? "explicit editor override" : i
			};
		}).filter((e) => t ? e.entity.entity_id === t && e.score === 110 : e.score >= 90);
		if (!r.length) continue;
		let i = Math.max(...r.map((e) => e.score)), o = r.filter((e) => e.score === i);
		o.length === 1 ? a.bindings[e] = o[0] : a.ambiguous[e] = o.map((e) => e.entity.entity_id);
	}
	let c = [
		"start",
		"pause",
		"resume",
		"stop"
	];
	for (let e of c) {
		let t = a.bindings[e];
		if (!t) continue;
		let n = c.filter((e) => a.bindings[e]?.entity.entity_id === t.entity.entity_id);
		if (n.length > 1) for (let e of n) a.ambiguous[e] = [t.entity.entity_id], delete a.bindings[e];
	}
	let l = new Set(Object.values(a.bindings).map((e) => e.entity.entity_id)), u = new Set(Object.values(a.ambiguous).flat());
	for (let e of s) e.entity.entity_category === "diagnostic" || e.domain === "button" ? l.has(e.entity.entity_id) || a.diagnostics.push(e) : !l.has(e.entity.entity_id) && !u.has(e.entity.entity_id) && a.extras.push(e);
	let d = [
		a.bindings.status,
		a.bindings.remaining,
		a.bindings.target_temperature,
		a.bindings.duration
	].filter((e) => !!e);
	return a.online = d.length ? d.some((e) => e.available) : s.some((e) => e.domain !== "button" && e.entity.entity_category !== "diagnostic" && e.available), a;
}
// src/cycle.ts
var J = {
	0: [
		"off",
		!1,
		!1,
		!1
	],
	1: [
		"idle",
		!1,
		!1,
		!1
	],
	2: [
		"cooking",
		!0,
		!1,
		!1
	],
	3: [
		"delay",
		!1,
		!1,
		!1
	],
	4: [
		"cooking",
		!1,
		!1,
		!1
	],
	5: [
		"preheat",
		!1,
		!1,
		!1
	],
	6: [
		"cooking",
		!1,
		!0,
		!1
	],
	7: [
		"preheat",
		!1,
		!0,
		!1
	],
	8: [
		"preheat",
		!0,
		!1,
		!1
	],
	9: [
		"cooking",
		!0,
		!1,
		!0
	],
	10: [
		"warm",
		!1,
		!1,
		!1
	],
	11: [
		"warm",
		!0,
		!1,
		!1
	],
	12: [
		"warm",
		!1,
		!0,
		!1
	],
	13: [
		"cooking",
		!1,
		!1,
		!1
	],
	14: [
		"cooking",
		!1,
		!1,
		!1
	]
}, We = [
	"off",
	"idle",
	"paused",
	"delay",
	"cooking",
	"preheat",
	"cooking completed",
	"preheat completed",
	"preheat paused",
	"turn pot paused",
	"keep warm",
	"keep warm paused",
	"keep warm completed",
	"crispy roast",
	"degrease"
];
function Y(e) {
	if (typeof e == "number") return Number.isInteger(e) && J[e] ? e : void 0;
	if (typeof e != "string" || !e.trim()) return;
	let t = e.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
	if (/^\d+(?:\.0+)?$/.test(t)) return Y(Number(t));
	if (t === "pause" || t === "cooking paused") return 2;
	let n = We.indexOf(t);
	return n < 0 ? void 0 : n;
}
function Ge(e) {
	let t = e.bindings.status;
	if (!e.online || t && !t.available) return {
		phase: "unavailable",
		paused: !1,
		completed: !1,
		reminder: !1
	};
	let n = t?.state?.state, r;
	if (e.adapter === "xiaomi_miot" && e.device?.model === "careli.fryer.maf10a" && (r = Y(n) ?? Y(t?.state?.attributes["air_fryer.status"])), r !== void 0 && J[r]) {
		let [e, t, i, a] = J[r];
		return {
			phase: e,
			paused: t,
			completed: i,
			reminder: a,
			raw: n,
			label: We[r]
		};
	}
	return {
		phase: "unknown",
		paused: !1,
		completed: !1,
		reminder: !1,
		raw: n
	};
}
function Ke(e, t) {
	if (e === void 0 || !e.trim() || !Number.isFinite(Number(e))) return;
	let n = {
		s: 1,
		sec: 1,
		seconds: 1,
		min: 60,
		minutes: 60,
		h: 3600,
		hours: 3600
	}[String(t)];
	return n && Number(e) >= 0 ? Number(e) * n : void 0;
}
function qe(e) {
	let t = e.bindings.remaining;
	if (t?.available) return Ke(t.state?.state, t.state?.attributes.unit_of_measurement);
}
function Je(e) {
	if (e === void 0) return "—";
	if (e < 60) return `${Math.round(e)} s`;
	let t = Math.ceil(e / 60);
	return t >= 60 ? `${Math.floor(t / 60)} h ${t % 60} min` : `${t} min`;
}
// src/refresh.ts
var Ye = [
	250,
	1250,
	3e3
];
function Xe(e, t) {
	let n = t.bindings.status;
	if (!t.device || !n || n.entity.device_id !== t.device.id || n.domain !== "sensor") return;
	let r = (t, n) => Object.hasOwn(e.services?.[t] || {}, n);
	if (t.adapter === "xiaomi_miot" && t.device.model === "careli.fryer.maf10a" && n.entity.platform === "xiaomi_miot" && r("xiaomi_miot", "get_properties")) return {
		domain: "xiaomi_miot",
		service: "get_properties",
		data: {
			entity_id: [n.entity.entity_id],
			mapping: [{
				siid: 2,
				piid: 1
			}],
			update_entity: !0
		}
	};
	if (r("homeassistant", "update_entity")) return {
		domain: "homeassistant",
		service: "update_entity",
		data: { entity_id: [n.entity.entity_id] }
	};
}
// src/commands.ts
function Ze(e) {
	let t = e.state?.attributes;
	if (!t || ![
		t.min,
		t.max,
		t.step
	].every((e) => typeof e == "number" && Number.isFinite(e))) return;
	let n = t.min, r = t.max, i = t.step;
	return n <= r && i > 0 ? {
		min: n,
		max: r,
		step: i
	} : void 0;
}
function Qe(e, t, n, r = "setting") {
	if (!n.online && e.role !== "power" || !e.available || !e.writable) throw Error("This control is currently unavailable or read-only.");
	if (e.role === "mode" && r !== "start") throw Error("Program changes are sent only when you press Start.");
	let i = { entity_id: e.entity.entity_id };
	if (e.domain === "number") {
		let n = Ze(e);
		if (typeof t != "number" || !Number.isFinite(t) || !n || t < n.min || t > n.max || Math.abs((t - n.min) / n.step - Math.round((t - n.min) / n.step)) > 1e-7) throw Error("Choose a value within the displayed range and step.");
		return {
			domain: "number",
			service: "set_value",
			data: {
				...i,
				value: t
			}
		};
	}
	if (e.domain === "select") {
		let n = e.state?.attributes.options;
		if (typeof t != "string" || !Array.isArray(n) || !n.includes(t)) throw Error("Choose a current option.");
		return {
			domain: "select",
			service: "select_option",
			data: {
				...i,
				option: t
			}
		};
	}
	if (e.domain === "switch" && typeof t == "boolean") return {
		domain: "switch",
		service: t ? "turn_on" : "turn_off",
		data: i
	};
	throw Error("Unsupported setting.");
}
function X(e, t) {
	let n = t.bindings[e];
	if (!t.online || !n?.available || !n.writable || n.domain !== "button") return !1;
	let r = Ge(t), i = t.bindings.fault?.state, a = t.adapter === "xiaomi_miot" && t.device?.model === "careli.fryer.maf10a" && ([
		"1",
		"2",
		"3",
		"E1",
		"E2",
		"E3"
	].includes(i?.state || "") || [
		1,
		2,
		3
	].includes(Number(i?.attributes["air_fryer.fault"])));
	return (e === "start" || e === "resume") && a || r.phase === "off" || r.phase === "unavailable" ? !1 : e === "start" ? r.phase === "idle" || r.completed && r.phase !== "preheat" : e === "resume" ? r.paused : e === "pause" ? [
		"cooking",
		"preheat",
		"warm"
	].includes(r.phase) && !r.paused && !r.completed : e === "stop" && [
		"cooking",
		"preheat",
		"warm",
		"delay"
	].includes(r.phase) && !r.completed;
}
function $e(e, t) {
	if (!X(e, t)) throw Error("This action is not available in the current state.");
	return {
		domain: "button",
		service: "press",
		data: { entity_id: t.bindings[e].entity.entity_id }
	};
}
var et = class {
	constructor(e = 35e3, t) {
		this.observationTimeoutMs = e, this.onProgress = t, this.pending = !1;
	}
	cancel() {
		this.abort?.abort();
	}
	async run(e, t, n) {
		await this.lock(async () => {
			let r = e(), i = q(r.ha, r.inventory, r.config), a = [...Object.values(i.bindings), ...i.extras].find((e) => e.entity.entity_id === t);
			if (!a) throw Error("The selected control has changed. Refresh the card.");
			let o = Qe(a, n, i);
			await r.ha.callService(o.domain, o.service, o.data);
			let s = typeof n == "boolean" ? n ? "on" : "off" : String(n);
			await this.observe(() => {
				let r = e().ha.states[t]?.state;
				return typeof n == "number" ? r !== void 0 && r.trim() !== "" && Number.isFinite(Number(r)) && Math.abs(Number(r) - n) < 1e-7 : r === s;
			}, "The device has not confirmed this setting. Check its state before starting.");
		});
	}
	async action(e, t) {
		await this.lock(async () => {
			let n = e(), r = q(n.ha, n.inventory, n.config), i = $e(t, r);
			await this.dispatchAndObserve(n.ha, i, e, t, r.device.id);
		});
	}
	async start(e, t) {
		await this.lock(async () => {
			let n = e(), r = q(n.ha, n.inventory, n.config), i = $e("start", r);
			if (t) {
				let i = r.bindings.mode;
				if (!i || t.entity_id !== i.entity.entity_id || t.device_id !== r.device?.id) throw Error("The program control has changed. Select the program again.");
				let a = Qe(i, t.option, r, "start");
				if (i.state?.state !== t.option) {
					await this.dispatchAndObserve(n.ha, a, e, "start", t.device_id);
					return;
				}
			}
			await this.dispatchAndObserve(n.ha, i, e, "start", r.device.id);
		});
	}
	async dispatchAndObserve(e, t, n, r, i) {
		let a = Date.now(), o = {
			role: r,
			phase: "sending",
			refreshes: 0,
			refreshFailed: !1,
			serviceFailed: !1
		};
		this.lastAction = o;
		let s = () => {
			this.lastAction === o && this.onProgress?.();
		};
		s();
		let c = !1, l;
		try {
			let u;
			try {
				u = e.callService(t.domain, t.service, t.data);
			} catch (e) {
				throw o.serviceMs = Date.now() - a, o.serviceFailed = !0, e;
			}
			Promise.resolve(u).then(() => {
				o.serviceMs = Date.now() - a, o.phase === "sending" && (o.phase = "accepted"), s();
			}, (e) => {
				c = !0, l = e, o.serviceMs = Date.now() - a, o.serviceFailed = !0, s();
			}), await this.observeAction(n, r, i, () => {
				if (c) throw l instanceof Error ? l : /* @__PURE__ */ Error("The HA command service failed.");
			}, () => {
				o.firstRefreshMs ??= Date.now() - a, o.refreshes++, s();
			}, () => {
				o.refreshFailed = !0, s();
			}), o.confirmedMs = Date.now() - a, o.phase = "confirmed", s();
		} catch (e) {
			throw o.phase = this.abort?.signal.aborted ? "cancelled" : "failed", s(), e;
		}
	}
	async observeAction(e, t, n, r, i, a) {
		let o = e(), s = Xe(o.ha, q(o.ha, o.inventory, o.config));
		await this.observe(() => {
			r?.();
			let i = e(), a = q(i.ha, i.inventory, i.config);
			if (a.device?.id !== n) throw Error("The selected device has changed. Check the appliance state.");
			let o = Ge(a);
			return t === "pause" ? o.paused : t === "stop" ? o.phase === "idle" || o.phase === "off" || o.completed : [
				"cooking",
				"preheat",
				"warm",
				"delay"
			].includes(o.phase) && !o.paused && !o.completed;
		}, "The device has not confirmed this action. Check its state before trying again.", () => {
			let t = e(), r = q(t.ha, t.inventory, t.config);
			if (r.device?.id !== n) return;
			let a = Xe(t.ha, r);
			if (a) return i?.(), t.ha.callService(a.domain, a.service, a.data);
		}, s?.domain === "xiaomi_miot" && s.service === "get_properties" ? 2 : 1, a);
	}
	async observe(e, t, n, r = 1, i) {
		let a = Date.now(), o = a + this.observationTimeoutMs, s = this.abort?.signal, c = !0, l = 0, u = !1, d = 0, f = -Infinity;
		try {
			for (; !e();) {
				if (s?.aborted) throw Error("Command observation cancelled.");
				let p = Date.now();
				if (p > o) throw Error(t);
				n && !u && l < r && d < Ye.length && p - a >= Ye[d] && p - f >= 1e3 && (d++, f = p, l++, Promise.resolve().then(() => {
					if (!c || s?.aborted || e()) return;
					let t = n();
					return t || (u = !0), t;
				}).catch(() => {
					u = !0, c && i?.();
				}).finally(() => {
					l--;
				})), await new Promise((e) => {
					let t = () => {
						clearTimeout(n), s?.removeEventListener("abort", t), e();
					}, n = setTimeout(t, 100);
					s?.addEventListener("abort", t, { once: !0 });
				});
			}
		} finally {
			c = !1;
		}
	}
	async lock(e) {
		if (this.pending) throw Error("A command is already pending.");
		this.pending = !0, this.abort = new AbortController();
		try {
			await e();
		} finally {
			this.pending = !1;
		}
	}
};
// src/registry.ts
function tt(e) {
	return e.entities.map((t) => ({
		entity_id: t.ei,
		device_id: t.di,
		name: t.en,
		platform: t.pl,
		translation_key: t.tk,
		hidden: t.hb,
		entity_category: t.ec === void 0 ? void 0 : e.entity_categories[t.ec]
	}));
}
var nt = class {
	constructor(e) {
		this.ha = e, this.listeners = /* @__PURE__ */ new Set(), this.unsubscribe = [], this.generation = 0, this.reload = !1;
	}
	updateHA(e) {
		this.ha = e;
	}
	async load(e = !1) {
		if (this.pending) return e && (this.reload = !0), this.pending;
		if (!this.data || e) return this.pending = this.fetch().finally(() => {
			this.pending = void 0, this.reload && this.listeners.size && (this.reload = !1, this.load(!0));
		}), this.pending;
	}
	async fetch() {
		let e = this.ha, t = Object.values(e.entities || {}), n = Object.values(e.devices || {}), r = [];
		if (e.callWS) {
			let i = await Promise.allSettled([e.callWS({ type: "config/entity_registry/list" }), e.callWS({ type: "config/device_registry/list" })]);
			if (i[0].status === "fulfilled") t = i[0].value;
			else if (!t.length) try {
				t = tt(await e.callWS({ type: "config/entity_registry/list_for_display" }));
			} catch {
				r.push("Entity registry unavailable.");
			}
			i[1].status === "fulfilled" ? n = i[1].value : n.length || r.push("Device registry unavailable.");
		}
		if (this.warning = r.join(" ") || void 0, this.listeners.size) {
			this.data = {
				entities: t,
				devices: n
			};
			for (let e of this.listeners) e(this.data, this.warning);
		}
	}
	add(e) {
		return this.listeners.add(e), this.data && e(this.data, this.warning), this.listeners.size === 1 && this.subscribe(), this.load(), () => {
			this.listeners.delete(e), this.listeners.size || (this.generation++, this.unsubscribe.splice(0).forEach((e) => e()), this.data = void 0);
		};
	}
	async subscribe() {
		let e = this.ha.connection?.subscribeEvents;
		if (!e) return;
		let t = ++this.generation;
		for (let n of ["entity_registry_updated", "device_registry_updated"]) try {
			let r = await e.call(this.ha.connection, () => {
				this.load(!0);
			}, n);
			t !== this.generation || !this.listeners.size ? r() : this.unsubscribe.push(r);
		} catch {}
	}
}, rt = /* @__PURE__ */ new WeakMap();
function it(e, t) {
	let n = e.connection || e, r = rt.get(n);
	return r || (r = new nt(e), rt.set(n, r)), r.updateHA(e), r.add(t);
}
// src/localize.ts
var at = {
	remaining: "Time remaining",
	temperature: "Temperature",
	duration: "Cooking time",
	mode: "Program",
	start: "Start cooking",
	pause: "Pause",
	resume: "Resume",
	stop: "Stop",
	start_selected: "Start selected program",
	program_staged: "Selected locally. Sent only when you press Start.",
	discard_program: "Discard program selection",
	turn_on: "Turn on",
	turn_off: "Turn off",
	discard_changes: "Discard changes",
	temperature_time: "Temperature & time",
	selected_program: "Selected program",
	program_defaults_short: "Set by program on Start",
	program_defaults: "The fryer supplies temperature and time when this program starts. Discard the selection to adjust the current settings.",
	reported_settings: "Settings last reported by the fryer. Program settings may take time to update.",
	power_on: "On",
	power_off: "Off",
	starting: "Starting…",
	pausing: "Pausing…",
	resuming: "Resuming…",
	stopping: "Stopping…",
	power_unavailable: "Power control is currently unavailable. Check the appliance connection.",
	action_wait: "Command sent. Waiting for a fresh HA status report. You only need to press once.",
	accepted_wait: "HA accepted the command. Waiting for a fresh status report. You only need to press once.",
	version: "Loaded card version",
	resume_missing: "Resume is not bound. Check discovery details and the Resume override in the card editor.",
	power_missing: "Remote power control is not available here. Use the appliance’s power button.",
	preheat: "Preheat",
	auto_keep_warm: "Auto keep warm",
	current_keep_warm: "Keep warm this cycle",
	weight: "Cooking weight",
	reservation: "Reservation time",
	measure: "Food quantity",
	texture: "Texture",
	reminder: "Shake reminder",
	reminder_config: "Shake reminder enabled",
	power: "Power",
	current_temperature: "Current temperature",
	fault: "Error",
	more: "More settings",
	diagnostics: "Discovery details",
	apply: "Apply",
	unavailable: "Live data unavailable",
	offline_hint: "The fryer may be switched off. Controls return when it reconnects.",
	idle: "Ready to cook",
	off: "Off",
	cooking: "Cooking",
	preheat_phase: "Preheating",
	warm: "Keeping warm",
	delay: "Scheduled",
	unknown: "State not recognized",
	paused: "Paused",
	completed: "Completed",
	shake: "Time to turn your food",
	waiting: "Waiting for device confirmation…",
	requested: "Command sent. Waiting for the device state to update.",
	choose: "Choose an air fryer in the card editor.",
	none: "No air fryer discovered yet.",
	loading: "Loading device information…",
	device: "Air fryer",
	automatic: "Automatic — only when exactly one fryer is found",
	title: "Card title",
	hidden: "Include hidden entities",
	overrides: "Optional capability overrides",
	automatic_binding: "Automatic discovery",
	no_override: "Automatic / no override",
	confirm_stop: "Stop the current program?",
	cancel: "Cancel",
	confirm: "Stop program",
	readonly: "Read-only",
	missing_schema: "Waiting for control limits",
	no_options: "No options available",
	discovery_warning: "Some capabilities need attention. Open discovery details.",
	export: "Download sanitized snapshot",
	diagnostics_note: "Snapshot contains selected-device capability metadata only. Identifiers and names are replaced."
}, ot = {
	remaining: "Preostalo vreme",
	temperature: "Temperatura",
	duration: "Vreme pripreme",
	mode: "Program",
	start: "Pokreni pripremu",
	pause: "Pauziraj",
	resume: "Nastavi",
	stop: "Zaustavi",
	start_selected: "Pokreni izabrani program",
	program_staged: "Izabrano lokalno. Šalje se tek kada pritisnete Pokreni.",
	discard_program: "Poništi izbor programa",
	turn_on: "Uključi",
	turn_off: "Isključi",
	discard_changes: "Poništi izmene",
	temperature_time: "Temperatura i vreme",
	selected_program: "Izabrani program",
	program_defaults_short: "Program podešava pri pokretanju",
	program_defaults: "Uređaj određuje temperaturu i vreme pri pokretanju ovog programa. Poništite izbor da biste izmenili trenutna podešavanja.",
	reported_settings: "Poslednja podešavanja koja je uređaj prijavio. Podešavanja programa mogu da se ažuriraju sa zakašnjenjem.",
	power_on: "Uključi",
	power_off: "Isključi",
	starting: "Pokretanje…",
	pausing: "Pauziranje…",
	resuming: "Nastavljanje…",
	stopping: "Zaustavljanje…",
	power_unavailable: "Napajanje trenutno nije dostupno za kontrolu. Proverite vezu uređaja.",
	action_wait: "Komanda je poslata. Čekanje novog izveštaja stanja iz HA. Dovoljan je jedan pritisak.",
	accepted_wait: "HA je prihvatio komandu. Čekanje novog izveštaja stanja. Dovoljan je jedan pritisak.",
	version: "Učitana verzija kartice",
	resume_missing: "Nastavljanje nije povezano. Proverite detalje otkrivanja i opciju Resume u editoru kartice.",
	power_missing: "Daljinsko uključivanje nije dostupno ovde. Koristite dugme na uređaju.",
	preheat: "Predgrevanje",
	auto_keep_warm: "Automatsko održavanje toplote",
	current_keep_warm: "Održavanje toplote za ovaj ciklus",
	weight: "Težina namirnica",
	reservation: "Vreme rezervacije",
	measure: "Količina hrane",
	texture: "Tekstura",
	reminder: "Podsetnik za okretanje",
	reminder_config: "Podsetnik za okretanje uključen",
	power: "Napajanje",
	current_temperature: "Trenutna temperatura",
	fault: "Greška",
	more: "Dodatna podešavanja",
	diagnostics: "Detalji otkrivanja",
	apply: "Primeni",
	unavailable: "Podaci trenutno nisu dostupni",
	offline_hint: "Uređaj je možda isključen. Kontrole se vraćaju kada se poveže.",
	idle: "Spremno za pripremu",
	off: "Isključeno",
	cooking: "Priprema",
	preheat_phase: "Predgrevanje",
	warm: "Održavanje toplote",
	delay: "Zakazano",
	unknown: "Nepoznato stanje",
	paused: "Pauzirano",
	completed: "Završeno",
	shake: "Vreme je da okrenete hranu",
	waiting: "Čekanje potvrde uređaja…",
	requested: "Komanda je poslata. Čekanje novog stanja uređaja.",
	choose: "Izaberite air fryer u editoru kartice.",
	none: "Air fryer još nije pronađen.",
	loading: "Učitavanje podataka uređaja…",
	device: "Air fryer",
	automatic: "Automatski — kada postoji tačno jedan uređaj",
	title: "Naslov kartice",
	hidden: "Prikaži skrivene entitete",
	overrides: "Opcione izmene povezivanja",
	automatic_binding: "Automatsko otkrivanje",
	no_override: "Automatski / bez izmene",
	confirm_stop: "Zaustaviti trenutni program?",
	cancel: "Otkaži",
	confirm: "Zaustavi program",
	readonly: "Samo čitanje",
	missing_schema: "Čekanje ograničenja kontrole",
	no_options: "Nema dostupnih opcija",
	discovery_warning: "Neke mogućnosti zahtevaju proveru. Otvorite detalje otkrivanja.",
	export: "Preuzmi anonimizovani snimak",
	diagnostics_note: "Snimak sadrži samo metapodatke mogućnosti izabranog uređaja. Identifikatori i nazivi su zamenjeni."
};
function Z(e, t) {
	return (e?.locale?.language || e?.language || "").startsWith("sr") && ot[t] || at[t];
}
// src/version.ts
var Q = "0.1.6";
// src/snapshot.ts
function st(e, t) {
	let n = [
		...Object.values(e.bindings),
		...e.extras,
		...e.diagnostics
	], r = /* @__PURE__ */ new Set();
	return {
		schema: 1,
		card_version: Q,
		source: "selected-device card snapshot",
		adapter: e.adapter,
		last_action: t ? {
			role: t.role,
			phase: t.phase,
			service_ms: t.serviceMs,
			confirmed_ms: t.confirmedMs,
			first_refresh_ms: t.firstRefreshMs,
			refreshes: t.refreshes,
			refresh_failed: t.refreshFailed,
			service_failed: t.serviceFailed
		} : void 0,
		model: e.device?.model === "careli.fryer.maf10a" ? "careli.fryer.maf10a" : "other",
		entities: n.filter((e) => !r.has(e.entity.entity_id) && (r.add(e.entity.entity_id), !0)).map((e, t) => {
			let n = e.state?.attributes || {}, r = {};
			for (let e of [
				"min",
				"max",
				"step"
			]) typeof n[e] == "number" && Number.isFinite(n[e]) && (r[e] = n[e]);
			let i = typeof n.unit_of_measurement == "string" && [
				"°C",
				"°F",
				"min",
				"s",
				"h",
				"g",
				"kg",
				"%"
			].includes(n.unit_of_measurement) ? n.unit_of_measurement : void 0;
			return {
				entity_id: `${e.domain}.sample_${t + 1}`,
				device_id: "sample_fryer",
				role: e.role,
				available: e.available,
				writable: e.writable,
				category: e.entity.entity_category,
				unit: i,
				...r,
				option_count: Array.isArray(n.options) ? n.options.length : void 0
			};
		}),
		ambiguous_roles: Object.keys(e.ambiguous),
		excluded_count: e.excluded.length
	};
}
// src/styles.ts
var ct = o`
  :host { display: block; color: var(--primary-text-color, #f3f1eb); font-family: var(--paper-font-body1_-_font-family, system-ui, sans-serif); }
  * { box-sizing: border-box; }
  ha-card { display: block; overflow: hidden; border: 1px solid var(--ha-card-border-color, #ffffff14); border-radius: var(--ha-card-border-radius, 24px); background: var(--ha-card-background, var(--card-background-color, #202321)); box-shadow: var(--ha-card-box-shadow, none); }
  .body { padding: 24px; }
  header { display: flex; align-items: flex-start; gap: 12px; justify-content: space-between; }
  h2 { margin: 0; font-size: 20px; font-weight: 650; letter-spacing: -.5px; }
  .muted, small { color: var(--secondary-text-color, #a8afa8); }
  .subtitle { margin-top: 6px; font-size: 13px; }
  .badge { display: flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: 20px; background: var(--secondary-background-color, #ffffff09); font-size: 12px; white-space: nowrap; }
  .dot { width: 6px; height: 6px; background: #a6bd92; border-radius: 50%; }
  .inactive .dot { background: var(--disabled-text-color, #8b918b); }
  .hero { display: flex; align-items: center; justify-content: space-between; gap: 18px; min-height: 155px; margin: 14px 0 8px; }
  .hero > div { min-width: 0; overflow-wrap: anywhere; }
  .hero-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1.6px; }
  .time { font-size: clamp(28px, 7vw, 40px); font-weight: 600; letter-spacing: -1.4px; line-height: 1.3; margin: 5px 0; }
  .status { font-size: 14px; color: var(--primary-text-color); }
  .illustration { width: 118px; height: 134px; flex-shrink: 0; color: var(--primary-color, #c4d6ad); }
  .inactive .illustration { opacity: .45; }
  .hint { font-size: 13px; line-height: 1.5; margin: 10px 0 18px; }
  .numbers { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .control { padding: 13px; border: 1px solid var(--divider-color, #ffffff12); border-radius: 14px; min-width: 0; }
  .control label { display: block; font-size: 12px; color: var(--secondary-text-color, #acb2ab); margin-bottom: 8px; }
  .number-line { display: flex; gap: 6px; align-items: center; }
  .number-line input { width: 100%; min-width: 0; font-size: 23px; font-weight: 550; padding: 0; background: transparent; border: 0; }
  .number-line .unit { font-size: 13px; white-space: nowrap; }
  .range { display: block; margin-top: 5px; font-size: 10px; }
  .apply { margin-top: 9px; width: 100%; }
  .discard { margin-top: 6px; width: 100%; font-size: 12px; }
  input, select, button { font-family: inherit; color: inherit; font-size: 14px; }
  input, select { accent-color: var(--primary-color, #bacfa4); }
  select, .editor-input { width: 100%; background: var(--secondary-background-color, #ffffff08); padding: 12px; border: 1px solid var(--divider-color, #ffffff1c); border-radius: 10px; }
  option { background: var(--card-background-color, #252925); color: var(--primary-text-color, #f3f1eb); }
  button { border: 1px solid var(--divider-color, #ffffff20); background: transparent; border-radius: 11px; padding: 10px 14px; cursor: pointer; }
  button.primary { background: var(--primary-color, #c4d6ad); border-color: transparent; color: var(--text-primary-color, #142010); font-weight: 650; }
  button:disabled, input:disabled, select:disabled { cursor: default; opacity: .5; }
  button:hover:enabled { filter: brightness(1.1); }
  :focus-visible { outline: 2px solid var(--primary-color, #c4d6ad); outline-offset: 3px; }
  .program { margin: 12px 0; }
  .program label { display: block; font-size: 12px; margin-bottom: 7px; color: var(--secondary-text-color, #acb2ab); }
  .toggle { display: flex; align-items: center; justify-content: space-between; gap: 14px; min-height: 46px; font-size: 14px; }
  input[type=checkbox] { appearance: none; width: 36px; height: 21px; background: var(--disabled-color, #626961); border-radius: 20px; position: relative; flex-shrink: 0; }
  input[type=checkbox]::after { content: ''; position: absolute; top: 3px; left: 3px; width: 15px; height: 15px; border-radius: 50%; background: #eef2e8; transition: transform .15s; }
  input[type=checkbox]:checked { background: var(--primary-color, #b5cda0); }
  input[type=checkbox]:checked::after { transform: translateX(15px); background: #26341e; }
  .actions { display: flex; gap: 8px; margin-top: 16px; }
  .power-section { border: 1px solid var(--divider-color, #ffffff20); border-radius: 14px; padding: 12px 14px; margin-bottom: 16px; }
  .power-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .power-buttons { display: flex; gap: 6px; }
  .power-buttons button { min-width: 58px; }
  .power-buttons button:disabled { opacity: .7; }
  .power-buttons button[aria-pressed=true] { border-color: var(--primary-color, #c4d6ad); color: var(--primary-color, #c4d6ad); opacity: 1; }
  .power-section .notice { font-size: 11px; margin-bottom: 0; }
  .actions button { flex: 1; }
  .actions button[aria-busy=true] { opacity: 1; }
  .spinner { display: inline-block; width: 13px; height: 13px; margin-right: 7px; vertical-align: -2px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .pending-notice { background: var(--secondary-background-color, #ffffff08); border-radius: 10px; padding: 12px; font-size: 13px; line-height: 1.5; }
  .error { padding: 11px 13px; border-radius: 10px; background: color-mix(in srgb, var(--error-color, #d77364) 13%, transparent); color: var(--error-color, #ffb3a5); font-size: 13px; line-height: 1.5; }
  .notice { font-size: 12px; line-height: 1.5; margin-top: 12px; }
  details { border-top: 1px solid var(--divider-color, #ffffff12); margin-top: 18px; padding-top: 15px; }
  summary { cursor: pointer; font-size: 13px; color: var(--secondary-text-color, #b4bcb2); }
  details .control, details .program { margin-top: 12px; }
  details.cook-settings { border: 1px solid var(--divider-color, #ffffff1c); border-radius: 12px; padding: 0 12px; margin-top: 12px; }
  .cook-settings summary { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; padding: 12px 0; min-height: 46px; color: var(--primary-text-color); list-style: none; }
  .cook-settings summary::before { content: '›'; font-size: 18px; line-height: 1; }
  .cook-settings[open] summary::before { transform: rotate(90deg); }
  .cook-settings summary::-webkit-details-marker { display: none; }
  .settings-value { margin-left: auto; color: var(--secondary-text-color, #a8afa8); font-size: 12px; overflow-wrap: anywhere; }
  .cook-settings .numbers .control { margin-top: 0; }
  .cook-settings[open] { padding-bottom: 8px; }
  .reading { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; padding: 10px 0; }
  .discovery { font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
  .discovery dt { font-weight: 650; margin-top: 8px; }
  .discovery dd { margin-left: 0; color: var(--secondary-text-color, #acb2ab); }
  .confirm { background: var(--secondary-background-color, #30362d); padding: 14px; margin-top: 12px; border-radius: 12px; }
  .editor-field { margin-bottom: 16px; }
  .editor-field > label { display: block; margin-bottom: 6px; font-size: 13px; }
  @media (max-width: 340px) { .body { padding: 16px; } .illustration { width: 88px; } .badge { font-size: 10px; } }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`, lt = class extends z {
	constructor(...e) {
		super(...e), this._config = { type: "custom:air-fryer-card" }, this._error = "", this._warning = "", this._pending = !1, this._stop = !1, this.commander = new et(35e3, () => this.requestUpdate()), this.drafts = /* @__PURE__ */ new Map(), this.environment = () => ({
			ha: this._ha,
			inventory: this.inventory(),
			config: this.effectiveConfig()
		});
	}
	static {
		this.styles = ct;
	}
	static {
		this.properties = {
			_ha: { state: !0 },
			_config: { state: !0 },
			_inventory: { state: !0 },
			_error: { state: !0 },
			_pending: { state: !0 },
			_pendingAction: { state: !0 },
			_stop: { state: !0 },
			_warning: { state: !0 },
			_program: { state: !0 }
		};
	}
	set hass(e) {
		this._ha = e, this.observe();
	}
	get hass() {
		return this._ha;
	}
	setConfig(e) {
		if (e.device_id !== void 0 && typeof e.device_id != "string") throw Error("device_id must be a string.");
		if (e.overrides && typeof e.overrides != "object") throw Error("overrides must be an object.");
		this._pending && this.commander.cancel(), this._config.device_id !== e.device_id && (this._automaticDevice = void 0), this._config = {
			...e,
			type: "custom:air-fryer-card"
		}, this.drafts.clear(), this._program = void 0, this._stop = !1, this._error = "";
	}
	static getConfigElement() {
		return document.createElement("air-fryer-card-editor");
	}
	static getStubConfig() {
		return { type: "custom:air-fryer-card" };
	}
	getCardSize() {
		return 7;
	}
	getGridOptions() {
		return {
			columns: 12,
			min_columns: 6,
			rows: "auto"
		};
	}
	connectedCallback() {
		super.connectedCallback(), this.setAttribute("data-card-version", Q), this.observe();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._watch?.(), this._watch = void 0, this._connection = void 0, this.commander.cancel();
	}
	observe() {
		if (!this.isConnected || !this._ha) return;
		let e = this._ha.connection || this._ha;
		e !== this._connection && (this._watch?.(), this._connection = e, this._watch = it(this._ha, (e, t) => {
			this._inventory = e, this._warning = t || "";
		}));
	}
	effectiveConfig() {
		return this._config.device_id || !this._automaticDevice ? this._config : {
			...this._config,
			device_id: this._automaticDevice
		};
	}
	inventory() {
		let e = new Map(this._inventory?.entities.map((e) => [e.entity_id, e]) || []);
		for (let t of Object.values(this._ha?.entities || {})) e.set(t.entity_id, {
			...e.get(t.entity_id),
			...t
		});
		let t = new Map(this._inventory?.devices.map((e) => [e.id, e]) || []);
		for (let e of Object.values(this._ha?.devices || {})) t.set(e.id, e);
		return {
			entities: [...e.values()],
			devices: [...t.values()]
		};
	}
	async change(e, t) {
		if (!this._pending) {
			this._pending = !0, this._error = "";
			try {
				await this.commander.run(this.environment, e.entity.entity_id, t), this.drafts.delete(e.entity.entity_id);
			} catch (e) {
				this._error = e instanceof Error ? e.message : "Command failed.";
			} finally {
				this._pending = !1, this.requestUpdate();
			}
		}
	}
	async action(e) {
		if (this._pending || e === "start" && this.drafts.size) return;
		let t = this._config;
		this._pending = !0, this._pendingAction = e, this._error = "", this._stop = !1, this.requestUpdate();
		try {
			if (await this.updateComplete, !this.isConnected || this._config !== t) return;
			e === "start" ? (await this.commander.start(this.environment, this._program), this._program = void 0) : await this.commander.action(this.environment, e);
		} catch (e) {
			this._error = e instanceof Error ? e.message : "Command failed.";
		} finally {
			this._pending = !1, this._pendingAction = void 0, this.requestUpdate();
		}
	}
	progressLabel() {
		let e = this._pendingAction === "start" ? "starting" : this._pendingAction === "pause" ? "pausing" : this._pendingAction === "resume" ? "resuming" : this._pendingAction === "stop" ? "stopping" : "waiting";
		return Z(this._ha, e);
	}
	display(e) {
		if (!e?.available || !e.state) return "—";
		try {
			return this._ha?.formatEntityState?.(e.state) || e.state.state.trim();
		} catch {
			return e.state.state;
		}
	}
	label(e) {
		let t = e.role;
		return t === "target_temperature" ? Z(this._ha, "temperature") : t && !["status", "remaining"].includes(t) ? Z(this._ha, t) : String(e.state?.attributes.friendly_name || e.entity.name || e.entity.entity_id.split(".")[1]);
	}
	control(e, t) {
		let n = e.entity.entity_id, r = this.label(e), i = this._pending || !t.online || !e.available || !e.writable;
		if (!e.writable || ![
			"number",
			"select",
			"switch"
		].includes(e.domain)) return A`
      <div class="reading"><span>${r}</span><span>${this.display(e)}</span></div>`;
		if (e.domain === "switch") return A`<label class="toggle"><span>${r}</span>
      <input aria-label=${r} type="checkbox" .checked=${e.state?.state === "on"} ?disabled=${i}
        @change=${(t) => {
			let n = t.target;
			this.change(e, n.checked), n.checked = e.state?.state === "on";
		}}></label>`;
		if (e.domain === "select") {
			let a = Array.isArray(e.state?.attributes.options) ? e.state.attributes.options.filter((e) => typeof e == "string") : [], o = e.role === "mode", s = o && this._program?.entity_id === n ? this._program.option : e.state?.state || "";
			return A`<div class="program"><label for=${n}>${r}</label><select id=${n} aria-label=${r}
        ?disabled=${i || !a.length || o && (!X("start", t) || this.drafts.size > 0)} @change=${(r) => {
				let i = r.target;
				o ? (this._program = i.value === e.state?.state ? void 0 : {
					entity_id: n,
					device_id: t.device.id,
					option: i.value
				}, this._error = "") : (this.change(e, i.value), i.value = s);
			}}>
        ${a.includes(s) ? M : A`<option value="" selected>${e.available ? s : "—"}</option>`}
        ${a.map((e) => A`<option value=${e} ?selected=${s === e}>${e.trim()}</option>`)}</select>
        ${o && this._program ? A`<p class="notice muted">${Z(this._ha, "program_staged")}</p>
          <button ?disabled=${this._pending} @click=${() => this._program = void 0}>${Z(this._ha, "discard_program")}</button>` : M}</div>`;
		}
		let a = Ze(e), o = this.drafts.get(n), s = o ?? (e.available && e.state?.state || "");
		return A`<div class="control"><label for=${n}>${r}</label><div class="number-line">
      <input id=${n} aria-label=${r} type="number" inputmode="decimal" min=${a?.min ?? ""} max=${a?.max ?? ""} step=${a?.step ?? "any"}
        .value=${s} placeholder="—" ?disabled=${i || !a} @input=${(t) => {
			let r = t.target.value;
			r === e.state?.state ? this.drafts.delete(n) : this.drafts.set(n, r), this.requestUpdate();
		}}><span class="unit">${e.state?.attributes.unit_of_measurement || ""}</span></div>
      <small class="range">${a ? `${a.min}–${a.max} · ${a.step}` : Z(this._ha, "missing_schema")}</small>
      ${o === void 0 ? M : A`<button class="apply" ?disabled=${i || !o.trim() || !a}
        @click=${() => void this.change(e, Number(o))}>${Z(this._ha, "apply")}</button>
        <button class="discard" ?disabled=${this._pending} @click=${() => {
			this.drafts.delete(n), this.requestUpdate();
		}}>${Z(this._ha, "discard_changes")}</button>`}</div>`;
	}
	settingSummary(e) {
		if (!e?.available) return "—";
		let t = e.state?.attributes.unit_of_measurement;
		if (e.role === "duration") {
			let n = Ke(e.state?.state, t);
			if (n !== void 0) return Je(n);
		}
		return `${e.state?.state.trim() || "—"}${typeof t == "string" ? ` ${t}` : ""}`;
	}
	export(e) {
		let t = URL.createObjectURL(new Blob([JSON.stringify(st(e, this.commander.lastAction), null, 2)], { type: "application/json" })), n = document.createElement("a");
		n.href = t, n.download = "air-fryer-snapshot.json", n.click(), setTimeout(() => URL.revokeObjectURL(t), 1e3);
	}
	render() {
		if (!this._ha) return A`<ha-card><div class="body">${Z(this._ha, "loading")}</div></ha-card>`;
		let e = this.inventory(), t = q(this._ha, e, this.effectiveConfig()), n = Ge(t);
		if (t.device && !this._config.device_id && !this._automaticDevice && (this._automaticDevice = t.device.id), !t.device) return A`<ha-card><div class="body"><h2>Air Fryer</h2><p class="hint">${this._inventory ? K(e).length ? Z(this._ha, "choose") : Z(this._ha, "none") : Z(this._ha, "loading")}</p>
      ${this._warning ? A`<p class="error">${this._warning}</p>` : M}</div></ha-card>`;
		let r = t.bindings;
		this._program && (this._program.device_id !== t.device.id || this._program.entity_id !== r.mode?.entity.entity_id) && (this._program = void 0);
		let i = n.phase === "idle", a = [
			"cooking",
			"preheat",
			"warm",
			"delay"
		].includes(n.phase) && !n.completed, o = i && r.duration?.available ? Ke(r.duration.state?.state, r.duration.state?.attributes.unit_of_measurement) : qe(t), s = n.phase === "unknown" ? this.display(r.status) : n.phase === "preheat" ? Z(this._ha, "preheat_phase") : Z(this._ha, n.phase), c = n.paused ? Z(this._ha, "paused") : n.completed ? Z(this._ha, "completed") : "", l = [
			"current_keep_warm",
			"weight",
			"reservation",
			"measure",
			"texture",
			"reminder",
			"reminder_config"
		], u = [
			"target_temperature",
			"duration",
			"preheat",
			"auto_keep_warm"
		], d = [...a ? u : [], ...l].flatMap((e) => r[e] ? [r[e]] : []).concat(t.extras), f = t.adapter === "xiaomi_miot" && t.device.model === "careli.fryer.maf10a" ? [
			"0",
			"no faults",
			"no_faults"
		] : [], p = r.fault?.available && !f.includes(r.fault.state?.state.trim().toLowerCase() || ""), m = !!r.power?.available && r.power.writable && ["on", "off"].includes(r.power.state?.state || ""), h = Xe(this._ha, t);
		return A`<ha-card class=${t.online ? "" : "inactive"} aria-busy=${this._pending ? "true" : "false"}><div class="body">
      <header><div><h2>${this._config.title || t.device.name_by_user || t.device.name || "Air Fryer"}</h2>
        <div class="subtitle muted">${t.device.manufacturer || "Air fryer"}</div></div>
        <span class="badge"><span class="dot"></span>${s}${c ? ` · ${c}` : ""}</span></header>
      <div class="hero"><div><div class="hero-label muted">${Z(this._ha, this._program && !a ? "selected_program" : i ? "duration" : "remaining")}</div>
        <div class="time">${this._program && !a ? this._program.option.trim() : Je(o)}</div>
        <div class="status">${this._program && !a ? Z(this._ha, "program_defaults_short") : r.mode ? this.display(r.mode) : s}</div>
        ${r.current_temperature ? A`<small>${Z(this._ha, "current_temperature")}: ${this.display(r.current_temperature)}</small>` : M}</div>
        <svg class="illustration" viewBox="0 0 118 134" aria-hidden="true"><rect x="15" y="10" width="88" height="116" rx="27" fill="currentColor" opacity=".12"/>
          <path d="M29 70h60v30a13 13 0 0 1-13 13H42a13 13 0 0 1-13-13Z" fill="currentColor" opacity=".18"/>
          <rect x="46" y="83" width="26" height="14" rx="5" fill="currentColor" opacity=".65"/>
          <circle cx="59" cy="40" r="14" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M59 32v8l5 4M40 63h38" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M43 3c-5-5 4-7 0-11M59 3c-5-5 4-7 0-11M75 3c-5-5 4-7 0-11" transform="translate(0 12)" fill="none" stroke="currentColor" stroke-width="2" opacity=".4"/>
        </svg></div>
      ${t.online ? M : A`<p class="hint muted">${Z(this._ha, "offline_hint")}</p>`}
      ${n.reminder ? A`<p class="hint">${Z(this._ha, "shake")}</p>` : M}
      ${p ? A`<p class="error">${Z(this._ha, "fault")}: ${this.display(r.fault)}</p>` : M}
      ${r.power ? A`<section class="power-section" aria-label=${Z(this._ha, "power")}><div class="power-row"><span>⏻ ${Z(this._ha, "power")}</span>
        <div class="power-buttons" role="group" aria-label=${Z(this._ha, "power")}>
          ${[!0, !1].map((e) => A`<button aria-label=${Z(this._ha, e ? "turn_on" : "turn_off")}
            aria-pressed=${m && r.power?.state?.state === (e ? "on" : "off") ? "true" : "false"}
            ?disabled=${this._pending || !m || r.power?.state?.state === (e ? "on" : "off")}
            @click=${() => {
			r.power && this.change(r.power, e);
		}}>${Z(this._ha, e ? "power_on" : "power_off")}</button>`)}
        </div></div>${m ? M : A`<p class="notice muted">${Z(this._ha, "power_unavailable")}</p>`}</section>` : M}
      ${a ? M : A`
        ${r.mode ? this.control(r.mode, t) : M}
        ${u.some((e) => r[e]) ? A`<details class="cook-settings">
          <summary><span>${Z(this._ha, "temperature_time")}</span><span class="settings-value">${this._program ? Z(this._ha, "program_defaults_short") : [r.target_temperature, r.duration].filter((e) => !!e).map((e) => this.settingSummary(e)).join(" · ")}</span></summary>
          ${this._program ? A`<p class="notice muted">${Z(this._ha, "program_defaults")}</p>` : A`
            <div class="numbers">${["target_temperature", "duration"].map((e) => r[e] ? this.control(r[e], t) : M)}</div>`}
          ${["preheat", "auto_keep_warm"].map((e) => r[e] ? this.control(r[e], t) : M)}
        </details>` : M}`}
      <div class="actions" data-action-state=${this._pendingAction || "ready"}>${this._pendingAction ? A`
        <button class="primary" disabled aria-busy="true"><span class="spinner" aria-hidden="true"></span>${this.progressLabel()}</button>` : [
			"start",
			"pause",
			"resume",
			"stop"
		].filter((e) => r[e] && (X(e, t) || !t.online) || e === "resume" && n.paused).map((e) => A`
        <button class=${e === "start" || e === "resume" ? "primary" : ""}
          ?disabled=${this._pending || e === "start" && this.drafts.size > 0 || !X(e, t)}
          @click=${() => {
			e === "stop" ? this._stop = !0 : this.action(e);
		}}>
          ${e === "start" && this._program ? Z(this._ha, "start_selected") : Z(this._ha, e)}</button>`)}</div>
      ${n.paused && !r.resume ? A`<p class="notice muted">${Z(this._ha, "resume_missing")}</p>` : M}
      ${this._stop ? A`<div class="confirm" role="alertdialog" aria-label=${Z(this._ha, "confirm_stop")}><div>${Z(this._ha, "confirm_stop")}</div><div class="actions">
        <button @click=${() => this._stop = !1}>${Z(this._ha, "cancel")}</button><button ?disabled=${this._pending} @click=${() => void this.action("stop")}>${Z(this._ha, "confirm")}</button></div></div>` : M}
      <div role="status" aria-live="polite">${this._pending ? A`<p class="pending-notice">${this._pendingAction ? Z(this._ha, this.commander.lastAction?.phase === "accepted" ? "accepted_wait" : "action_wait") : Z(this._ha, "waiting")}</p>` : M}</div>
      ${this._error ? A`<p class="error" role="alert">${this._error}</p>` : M}
      ${this.drafts.size ? A`<p class="notice muted">${Z(this._ha, "apply")} ${Z(this._ha, "temperature").toLowerCase()} / ${Z(this._ha, "duration").toLowerCase()}</p>` : M}
      ${Object.keys(t.ambiguous).length || this._warning ? A`<p class="notice muted">${Z(this._ha, "discovery_warning")}</p>` : M}
      ${d.length ? A`<details class="more-settings"><summary>${Z(this._ha, "more")}</summary>
        ${a ? A`<p class="notice muted">${Z(this._ha, "reported_settings")}</p>` : M}
        ${Le(d, (e) => e.entity.entity_id, (e) => this.control(e, t))}</details>` : M}
      <details><summary>${Z(this._ha, "diagnostics")} · v${Q}</summary><dl class="discovery">
        <dt>${Z(this._ha, "version")}</dt><dd>${Q}</dd>
        <dt>Adapter</dt><dd>${t.adapter}</dd>
        ${r.power ? M : A`<dt>${Z(this._ha, "power")}</dt><dd>${Z(this._ha, "power_missing")}</dd>`}
        <dt>Post-command status refresh</dt><dd>${h ? `${h.domain}.${h.service}` : "Reported state updates"}</dd>
        ${this.commander.lastAction ? A`
          <dt>Last command / result</dt><dd>${this.commander.lastAction.role} / ${this.commander.lastAction.phase}</dd>
          <dt>HA service response</dt><dd>${this.commander.lastAction.serviceMs === void 0 ? "Pending" : `${this.commander.lastAction.serviceMs} ms`}${this.commander.lastAction.serviceFailed ? " · failed" : ""}</dd>
          <dt>Reported state confirmed</dt><dd>${this.commander.lastAction.confirmedMs === void 0 ? "Not yet confirmed" : `${this.commander.lastAction.confirmedMs} ms`}</dd>
          <dt>Status refresh attempts / first request</dt><dd>${this.commander.lastAction.refreshes} / ${this.commander.lastAction.firstRefreshMs === void 0 ? "—" : `${this.commander.lastAction.firstRefreshMs} ms`}${this.commander.lastAction.refreshFailed ? " · refresh failed" : ""}</dd>` : M}
        <dt>Status state / raw attribute</dt><dd>${r.status?.state?.state || "—"} / ${String(r.status?.state?.attributes["air_fryer.status"] ?? "—")}</dd>
        ${Object.entries(t.bindings).map(([e, t]) => A`<dt>${e}</dt><dd>${t.entity.entity_id} · ${t.evidence}${t.writable ? "" : ` · ${Z(this._ha, "readonly")}`}</dd>`)}
        ${Object.entries(t.ambiguous).map(([e, t]) => A`<dt>${e}: ambiguous</dt><dd>${t.join(", ")}</dd>`)}
        ${t.diagnostics.map((e) => A`<dt>${this.label(e)}</dt><dd>${e.entity.entity_id} · ${Z(this._ha, "readonly")}</dd>`)}
        ${t.excluded.length ? A`<dt>Hidden / disabled</dt><dd>${t.excluded.length}</dd>` : M}</dl>
        <p class="notice muted">${Z(this._ha, "diagnostics_note")}</p><button @click=${() => this.export(t)}>${Z(this._ha, "export")}</button></details>
    </div></ha-card>`;
	}
}, ut = [
	"status",
	"remaining",
	"fault",
	"target_temperature",
	"current_temperature",
	"duration",
	"mode",
	"start",
	"pause",
	"resume",
	"stop",
	"preheat",
	"auto_keep_warm",
	"current_keep_warm",
	"weight",
	"reservation",
	"measure",
	"texture",
	"reminder",
	"reminder_config",
	"power"
], dt = class extends z {
	constructor(...e) {
		super(...e), this._config = { type: "custom:air-fryer-card" };
	}
	static {
		this.styles = ct;
	}
	static {
		this.properties = {
			_ha: { state: !0 },
			_config: { state: !0 },
			_inventory: { state: !0 }
		};
	}
	set hass(e) {
		this._ha = e, this.observe();
	}
	setConfig(e) {
		this._config = { ...e };
	}
	connectedCallback() {
		super.connectedCallback(), this.observe();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.stop?.(), this.stop = void 0, this.connection = void 0;
	}
	observe() {
		if (!this.isConnected || !this._ha) return;
		let e = this._ha.connection || this._ha;
		this.connection !== e && (this.stop?.(), this.connection = e, this.stop = it(this._ha, (e) => this._inventory = e));
	}
	change(e) {
		let t = {
			...this._config,
			...e
		};
		t.device_id || delete t.device_id, t.title || delete t.title, t.include_hidden || delete t.include_hidden, t.overrides && Object.keys(t.overrides).length || delete t.overrides, this._config = t, this.dispatchEvent(new CustomEvent("config-changed", {
			detail: { config: t },
			bubbles: !0,
			composed: !0
		}));
	}
	render() {
		let e = this._inventory || {
			entities: Object.values(this._ha?.entities || {}),
			devices: Object.values(this._ha?.devices || {})
		}, t = K(e), n = this._config.device_id || (t.length === 1 ? t[0].id : ""), r = e.devices.find((e) => e.id === this._config.device_id);
		r && !t.includes(r) && t.push(r);
		let i = e.entities.filter((e) => e.device_id === n && !e.disabled_by && (this._config.include_hidden || !(e.hidden || e.hidden_by)) && e.entity_category !== "diagnostic");
		return A`<div class="body"><div class="editor-field"><label for="device">${Z(this._ha, "device")}</label>
      <select id="device" aria-label=${Z(this._ha, "device")} @change=${(e) => this.change({
			device_id: e.target.value,
			overrides: void 0
		})}>
        <option value="" ?selected=${!this._config.device_id}>${Z(this._ha, "automatic")}</option>
        ${t.map((e) => A`<option value=${e.id} ?selected=${e.id === this._config.device_id}>${e.name_by_user || e.name || e.model || e.id}</option>`)}</select></div>
      <div class="editor-field"><label for="title">${Z(this._ha, "title")}</label><input class="editor-input" id="title" .value=${this._config.title || ""}
        @change=${(e) => this.change({ title: e.target.value })}></div>
      <label class="toggle"><span>${Z(this._ha, "hidden")}</span><input type="checkbox" .checked=${!!this._config.include_hidden}
        @change=${(e) => this.change({ include_hidden: e.target.checked })}></label>
      ${n ? A`<details><summary>${Z(this._ha, "overrides")}</summary>${ut.map((e) => A`<div class="editor-field"><label for=${e}>${e}</label>
        <select id=${e} aria-label=${`${e} override`} @change=${(t) => {
			let n = { ...this._config.overrides }, r = t.target.value;
			r ? n[e] = r : delete n[e], this.change({ overrides: n });
		}}><option value="" ?selected=${!this._config.overrides?.[e]}>${Z(this._ha, "no_override")}</option>
          ${i.map((t) => A`<option value=${t.entity_id} ?selected=${this._config.overrides?.[e] === t.entity_id}>
            ${String(this._ha?.states[t.entity_id]?.attributes.friendly_name || t.name || t.entity_id)} (${t.entity_id.split(".")[0]})</option>`)}</select></div>`)}</details>` : M}
    </div>`;
	}
};
customElements.get("air-fryer-card") || customElements.define("air-fryer-card", lt), customElements.get("air-fryer-card-editor") || customElements.define("air-fryer-card-editor", dt);
var $ = window;
$.customCards = $.customCards || [], $.customCards.some((e) => e.type === "air-fryer-card") || $.customCards.push({
	type: "air-fryer-card",
	name: "Air Fryer",
	description: "Automatically discovers your air fryer controls. Xiaomi Miot first; capability-driven design.",
	preview: !0
});
