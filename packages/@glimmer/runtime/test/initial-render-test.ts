import {
  TestEnvironment,
  TestDynamicScope,
  normalizeInnerHTML,
  equalTokens,
  assertNodeTagName,
} from "@glimmer/test-helpers";
import { module, test } from './support';
import { UpdatableReference } from '@glimmer/object-reference';
import { Simple, Opaque, Option } from '@glimmer/interfaces';

import {
  Template,
  DynamicAttributeFactory,
  IteratorResult,
  RenderResult,
  ElementBuilder,
  SimpleDynamicAttribute
} from '@glimmer/runtime';

let env: TestEnvironment;
let root: HTMLElement;

function compile(template: string) {
  let out = env.compile(template);
  return out;
}

function compilesTo(html: string, expected: string=html, context: any={}) {
  let template = compile(html);
  root = rootElement();
  QUnit.assert.ok(true, `template: ${html}`);
  render(template, context);
  equalTokens(root, expected);
}

function rootElement(): HTMLDivElement {
  return env.getDOM().createElement('div') as HTMLDivElement;
}

function commonSetup(customEnv = new TestEnvironment()) {
  env = customEnv; // TODO: Support SimpleDOM
  root = rootElement();
}

function render<T>(template: Template<T>, self: any) {
  let result: RenderResult;
  env.begin();
  let templateIterator = template.render({ self: new UpdatableReference(self), parentNode: root, dynamicScope: new TestDynamicScope() });
  let iteratorResult: IteratorResult<RenderResult>;
  do {
    iteratorResult = templateIterator.next();
  } while (!iteratorResult.done);

  result = iteratorResult.value;
  env.commit();
  return result;
}

function createElement<T extends keyof HTMLElementTagNameMap>(tag: T): HTMLElementTagNameMap[T] {
  return document.createElement(tag);
}

module("[glimmer runtime] Initial render", tests => {
  tests.beforeEach(() => commonSetup());

  module("Simple HTML, inline expressions", () => {
    function shouldBeVoid(tagName: string) {
      root.innerHTML = "";
      let html = "<" + tagName + " data-foo='bar'><p>hello</p>";
      let template = compile(html);
      render(template, {});

      let tag = '<' + tagName + ' data-foo="bar">';
      let closing = '</' + tagName + '>';
      let extra = "<p>hello</p>";
      html = normalizeInnerHTML(root.innerHTML);

      root = rootElement();

      QUnit.assert.pushResult({
        result: (html === tag + extra) || (html === tag + closing + extra),
        actual: html,
        expected: tag + closing + extra,
        message: tagName + " should be a void element"
      });
    }

    test("Void elements are self-closing", () => {
      let voidElements = "area base br col command embed hr img input keygen link meta param source track wbr";

      voidElements.split(" ").forEach((tagName) => shouldBeVoid(tagName));
    });

    test("The compiler can handle top-level unescaped td inside tr contextualElement", () => {
      let template = compile('{{{html}}}');
      let context = { html: '<td>Yo</td>' };
      let row = createElement('tr');
      root = row;
      render(template, context);

      assertNodeTagName(row.firstChild, 'td');
    });

    test("Mountain range of nesting", () => {
      let context = { foo: "FOO", bar: "BAR", baz: "BAZ", boo: "BOO", brew: "BREW", bat: "BAT", flute: "FLUTE", argh: "ARGH" };
      compilesTo('{{foo}}<span></span>', 'FOO<span></span>', context);
      compilesTo('<span></span>{{foo}}', '<span></span>FOO', context);
      compilesTo('<span>{{foo}}</span>{{foo}}', '<span>FOO</span>FOO', context);
      compilesTo('{{foo}}<span>{{foo}}</span>{{foo}}', 'FOO<span>FOO</span>FOO', context);
      compilesTo('{{foo}}<span></span>{{foo}}', 'FOO<span></span>FOO', context);
      compilesTo('{{foo}}<span></span>{{bar}}<span><span><span>{{baz}}</span></span></span>',
                'FOO<span></span>BAR<span><span><span>BAZ</span></span></span>', context);
      compilesTo('{{foo}}<span></span>{{bar}}<span>{{argh}}<span><span>{{baz}}</span></span></span>',
                'FOO<span></span>BAR<span>ARGH<span><span>BAZ</span></span></span>', context);
      compilesTo('{{foo}}<span>{{bar}}<a>{{baz}}<em>{{boo}}{{brew}}</em>{{bat}}</a></span><span><span>{{flute}}</span></span>{{argh}}',
                'FOO<span>BAR<a>BAZ<em>BOOBREW</em>BAT</a></span><span><span>FLUTE</span></span>ARGH', context);
    });
  });

  module("simple blocks", () => {
    test("The compiler can handle unescaped tr in top of content", () => {
      let template = compile('{{#identity}}{{{html}}}{{/identity}}');
      let context = { html: '<tr><td>Yo</td></tr>' };
      let table = createElement('table');
      root = table;
      render(template, context);

      assertNodeTagName(root.firstChild, 'tbody');
    });

    test("The compiler can handle unescaped tr inside fragment table", () => {
      let template = compile('<table>{{#identity}}{{{html}}}{{/identity}}</table>');
      let context = { html: '<tr><td>Yo</td></tr>' };
      render(template, context);
      if (assertNodeTagName(root.firstChild, 'table')) {
        assertNodeTagName(root.firstChild.firstChild, 'tbody');
      }
    });
  });

  module("inline helpers", () => {
    test("The compiler can handle simple helpers", () => {
      env.registerHelper('testing', function(params) {
        return params[0];
      });

      compilesTo('<div>{{testing title}}</div>', '<div>hello</div>', { title: 'hello' });
    });

    test("GH#13999 The compiler can handle simple helpers with inline null parameter", assert => {
      let value;
      env.registerHelper('say-hello', function(params) {
        value = params[0];
        return 'hello';
      });

      compilesTo('<div>{{say-hello null}}</div>', '<div>hello</div>');
      assert.strictEqual(value, null, 'is null');
    });

    test("GH#13999 The compiler can handle simple helpers with inline string literal null parameter", assert => {
      let value;
      env.registerHelper('say-hello', function(params) {
        value = params[0];
        return 'hello';
      });

      compilesTo('<div>{{say-hello "null"}}</div>', '<div>hello</div>');
      assert.strictEqual(value, 'null', 'is null string literal');
    });

    test("GH#13999 The compiler can handle simple helpers with inline undefined parameter", assert => {
      let value: Opaque = 'PLACEHOLDER';
      let length;
      env.registerHelper('say-hello', function(params) {
        length = params.length;
        value = params[0];
        return 'hello';
      });

      compilesTo('<div>{{say-hello undefined}}</div>', '<div>hello</div>');
      assert.strictEqual(length, 1);
      assert.strictEqual(value, undefined, 'is undefined');
    });

    test("GH#13999 The compiler can handle simple helpers with positional parameter undefined string literal", assert => {
      let value: Opaque = 'PLACEHOLDER';
      let length;
      env.registerHelper('say-hello', function(params) {
        length = params.length;
        value = params[0];
        return 'hello';
      });

      compilesTo('<div>{{say-hello "undefined"}} undefined</div>', '<div>hello undefined</div>');
      assert.strictEqual(length, 1);
      assert.strictEqual(value, 'undefined', 'is undefined string literal');
    });

    test("GH#13999 The compiler can handle components with undefined named arguments", assert => {
      let value: Opaque = 'PLACEHOLDER';
      env.registerHelper('say-hello', function(_, hash) {
        value = hash['foo'];
        return 'hello';
      });

      compilesTo('<div>{{say-hello foo=undefined}}</div>', '<div>hello</div>');
      assert.strictEqual(value, undefined, 'is undefined');
    });

    test("GH#13999 The compiler can handle components with undefined string literal named arguments", assert => {
      let value: Opaque = 'PLACEHOLDER';
      env.registerHelper('say-hello', function(_, hash) {
        value = hash['foo'];
        return 'hello';
      });

      compilesTo('<div>{{say-hello foo="undefined"}}</div>', '<div>hello</div>');
      assert.strictEqual(value, 'undefined', 'is undefined string literal');
    });

    test("GH#13999 The compiler can handle components with null named arguments", assert => {
      let value;
      env.registerHelper('say-hello', function(_, hash) {
        value = hash['foo'];
        return 'hello';
      });

      compilesTo('<div>{{say-hello foo=null}}</div>', '<div>hello</div>');
      assert.strictEqual(value, null, 'is null');
    });

    test("GH#13999 The compiler can handle components with null string literal named arguments", assert => {
      let value;
      env.registerHelper('say-hello', function(_, hash) {
        value = hash['foo'];
        return 'hello';
      });

      compilesTo('<div>{{say-hello foo="null"}}</div>', '<div>hello</div>');
      assert.strictEqual(value, 'null', 'is null string literal');
    });

    test("GH#13999 The compiler can handle components with undefined named arguments", () => {
      env.registerHelper('say-hello', function() {
        return 'hello';
      });

      compilesTo('<div>{{say-hello foo=undefined}}</div>', '<div>hello</div>');
    });

    test("Null curly in attributes", () => {
      compilesTo('<div class="foo {{null}}">hello</div>', '<div class="foo ">hello</div>');
    });

    test("Null in primitive syntax", () => {
      compilesTo('{{#if null}}NOPE{{else}}YUP{{/if}}', 'YUP');
    });

    test("The compiler can handle sexpr helpers", () => {
      env.registerHelper('testing', function(params) {
        return params[0] + "!";
      });

      compilesTo('<div>{{testing (testing "hello")}}</div>', '<div>hello!!</div>', {});
    });

    test("The compiler can handle multiple invocations of sexprs", () => {
      env.registerHelper('testing', function(params) {
        return "" + params[0] + params[1];
      });

      compilesTo(
        '<div>{{testing (testing "hello" foo) (testing (testing bar "lol") baz)}}</div>',
        '<div>helloFOOBARlolBAZ</div>',
        { foo: "FOO", bar: "BAR", baz: "BAZ" }
      );
    });

    test("The compiler passes along the hash arguments", () => {
      env.registerHelper('testing', function(_, hash) {
        return hash['first'] + '-' + hash['second'];
      });

      compilesTo('<div>{{testing first="one" second="two"}}</div>', '<div>one-two</div>');
    });

    // test("Attributes can use computed paths", function() {
    //   compilesTo('<a href="{{post.url}}">linky</a>', '<a href="linky.html">linky</a>', { post: { url: 'linky.html' }});
    // });

    /*

    test("It is possible to use RESOLVE_IN_ATTR for data binding", assert => {
      let callback;

      registerHelper('RESOLVE_IN_ATTR', function(parts, options) {
        return boundValue(function(c) {
          callback = c;
          return this[parts[0]];
        }, this);
      });

      let object = { url: 'linky.html' };
      let fragment = compilesTo('<a href="{{url}}">linky</a>', '<a href="linky.html">linky</a>', object);

      object.url = 'clippy.html';
      callback();

      equalTokens(fragment, '<a href="clippy.html">linky</a>');

      object.url = 'zippy.html';
      callback();

      equalTokens(fragment, '<a href="zippy.html">linky</a>');
    });
    */

    test("Attributes can be populated with helpers that generate a string", () => {
      env.registerHelper('testing', function(params) {
        return params[0];
      });

      compilesTo('<a href="{{testing url}}">linky</a>', '<a href="linky.html">linky</a>', { url: 'linky.html'});
    });
    /*
    test("A helper can return a stream for the attribute", assert => {
      env.registerHelper('testing', function(path, options) {
        return streamValue(this[path]);
      });

      compilesTo('<a href="{{testing url}}">linky</a>', '<a href="linky.html">linky</a>', { url: 'linky.html'});
    });
    */
    test("Attribute helpers take a hash", () => {
      env.registerHelper('testing', function(_, hash) {
        return hash['path'];
      });

      compilesTo('<a href="{{testing path=url}}">linky</a>', '<a href="linky.html">linky</a>', { url: 'linky.html' });
    });
    /*
    test("Attribute helpers can use the hash for data binding", assert => {
      let callback;

      env.registerHelper('testing', function(path, hash, options) {
        return boundValue(function(c) {
          callback = c;
          return this[path] ? hash.truthy : hash.falsy;
        }, this);
      });

      let object = { on: true };
      let fragment = compilesTo('<div class="{{testing on truthy="yeah" falsy="nope"}}">hi</div>', '<div class="yeah">hi</div>', object);

      object.on = false;
      callback();
      equalTokens(fragment, '<div class="nope">hi</div>');
    });
    */
    test("Attributes containing multiple helpers are treated like a block", () => {
      env.registerHelper('testing', function(params) {
        return params[0];
      });

      compilesTo(
        '<a href="http://{{foo}}/{{testing bar}}/{{testing "baz"}}">linky</a>',
        '<a href="http://foo.com/bar/baz">linky</a>',
        { foo: 'foo.com', bar: 'bar' }
      );
    });

    test("Attributes containing a helper are treated like a block", assert => {
      env.registerHelper('testing', function(params) {
        assert.deepEqual(params, [123]);
        return "example.com";
      });

      compilesTo(
        '<a href="http://{{testing 123}}/index.html">linky</a>',
        '<a href="http://example.com/index.html">linky</a>',
        { person: { url: 'example.com' } }
      );
    });
    test("Elements inside a yielded block", () => {
      compilesTo('{{#identity}}<div id="test">123</div>{{/identity}}', '<div id="test">123</div>');
    });

    test("A simple block helper can return text", () => {
      compilesTo('{{#identity}}test{{else}}not shown{{/identity}}', 'test');
    });

    test("A block helper can have an else block", () => {
      compilesTo('{{#render-inverse}}Nope{{else}}<div id="test">123</div>{{/render-inverse}}', '<div id="test">123</div>');
    });
  });

  module("miscellaneous", () => {
    test('Repaired text nodes are ensured in the right place', function () {
      let object = { a: "A", b: "B", c: "C", d: "D" };
      compilesTo('{{a}} {{b}}', 'A B', object);
      compilesTo('<div>{{a}}{{b}}{{c}}wat{{d}}</div>', '<div>ABCwatD</div>', object);
      compilesTo('{{a}}{{b}}<img><img><img><img>', 'AB<img><img><img><img>', object);
    });

    test("Simple elements can have dashed attributes", () => {
      let template = compile("<div aria-label='foo'>content</div>");
      render(template, {});

      equalTokens(root, '<div aria-label="foo">content</div>');
    });
  });
});

module('Style attributes', {
  beforeEach() {
    class StyleEnv extends TestEnvironment {
      attributeFor(element: Simple.Element, attr: string, isTrusting: boolean, namespace: Option<string>): DynamicAttributeFactory {
        if (attr === 'style' && !isTrusting) {
          return StyleAttribute;
        }

        return super.attributeFor(element, attr, isTrusting, namespace);
      }
    }

    commonSetup(new StyleEnv());

  },
  afterEach() {
    warnings = 0;
  }
}, () => {
  test(`using a static inline style on an element does not give you a warning`, function(assert) {
    let template = compile(`<div style="background: red">Thing</div>`);
    render(template, {});

    assert.strictEqual(warnings, 0);

    equalTokens(root, '<div style="background: red">Thing</div>', "initial render");
  });

  test(`triple curlies are trusted`, function(assert) {
    let template = compile(`<div foo={{foo}} style={{{styles}}}>Thing</div>`);
    render(template, {styles: 'background: red'});

    assert.strictEqual(warnings, 0);

    equalTokens(root, '<div style="background: red">Thing</div>', "initial render");
  });

  test(`using a static inline style on an namespaced element does not give you a warning`, function(assert) {
    let template = compile(`<svg xmlns:svg="http://www.w3.org/2000/svg" style="background: red" />`);

    render(template, {});

    assert.strictEqual(warnings, 0);

    equalTokens(root, '<svg xmlns:svg="http://www.w3.org/2000/svg" style="background: red"></svg>', "initial render");
  });
});

let warnings = 0;

class StyleAttribute extends SimpleDynamicAttribute {
  set(dom: ElementBuilder, value: Opaque): void {
    warnings++;
    super.set(dom, value);
  }

  update() {}
}
