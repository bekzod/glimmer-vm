import { Opaque, Option, Dict } from "@glimmer/interfaces";
import { Template, RenderResult, RenderOptions, IteratorResult } from "@glimmer/runtime";
import { TestEnvironment, TestDynamicScope, RenderTest as BaseRenderTest } from "@glimmer/test-helpers";
import { UpdatableReference } from "@glimmer/object-reference";
import { expect } from "@glimmer/util";

abstract class RenderTest extends BaseRenderTest {
  @test "HTML text content"() {
    this.render("content");
    this.assertHTML("content");
    this.assertStableRerender();
  }

  @test "HTML tags"() {
    this.render("<h1>hello!</h1><div>content</div>");
    this.assertHTML("<h1>hello!</h1><div>content</div>");
    this.assertStableRerender();
  }

  @test "HTML attributes"() {
    this.render("<div class='foo' id='bar'>content</div>");
    this.assertHTML("<div class='foo' id='bar'>content</div>");
    this.assertStableRerender();
  }

  @test "HTML data attributes"() {
    this.render("<div data-some-data='foo'>content</div>");
    this.assertHTML("<div data-some-data='foo'>content</div>");
    this.assertStableRerender();
  }

  @test "HTML checked attributes"() {
    this.render("<input checked='checked'>");
    this.assertHTML("<input checked='checked'>");
    this.assertStableRerender();
  }

  @test "Nested HTML"() {
    this.render("<div class='foo'><p><span id='bar' data-foo='bar'>hi!</span></p></div>&nbsp;More content");
    this.assertHTML("<div class='foo'><p><span id='bar' data-foo='bar'>hi!</span></p></div>&nbsp;More content");
    this.assertStableRerender();
  }

  @test "Supports quotes"() {
    this.render("<div>\"This is a title,\" we\'re on a boat</div>");
    this.assertHTML("<div>\"This is a title,\" we\'re on a boat</div>");
    this.assertStableRerender();
  }

  @test "Supports backslashes"() {
    this.render("<div>This is a backslash: \\</div>");
    this.assertHTML("<div>This is a backslash: \\</div>");
    this.assertStableRerender();
  }

  @test "Supports new lines"() {
    this.render("<div>common\n\nbro</div>");
    this.assertHTML("<div>common\n\nbro</div>");
    this.assertStableRerender();
  }

  @test "HTML tag with empty attribute"() {
    this.render("<div class=''>content</div>");
    this.assertHTML("<div class=''>content</div>");
    this.assertStableRerender();
  }

  @test "HTML boolean attribute 'disabled'"() {
    this.render('<input disabled>');
    this.assertHTML("<input disabled>");

    // TODO: What is the point of this test? (Note that it wouldn't work with SimpleDOM)
    // assertNodeProperty(root.firstChild, 'input', 'disabled', true);

    this.assertStableRerender();
  }

  @test "Quoted attribute null values do not disable"() {
    this.render('<input disabled="{{isDisabled}}">', { isDisabled: null });
    this.assertHTML('<input>');
    this.assertStableRerender();

    // TODO: What is the point of this test? (Note that it wouldn't work with SimpleDOM)
    // assertNodeProperty(root.firstChild, 'input', 'disabled', false);

    this.rerender({ isDisabled: true });
    this.assertHTML('<input disabled>');
    this.assertStableNodes();

    // TODO: ??????????
    this.rerender({ isDisabled: false });
    this.assertHTML('<input disabled>');
    this.assertStableNodes();

    this.rerender({ isDisabled: null });
    this.assertHTML('<input>');
    this.assertStableNodes();
  }

  @test "Unquoted attribute null values do not disable"() {
    this.render('<input disabled={{isDisabled}}>', { isDisabled: null });
    this.assertHTML('<input>');
    this.assertStableRerender();

    // TODO: What is the point of this test? (Note that it wouldn't work with SimpleDOM)
    // assertNodeProperty(root.firstChild, 'input', 'disabled', false);

    this.rerender({ isDisabled: true });
    this.assertHTML('<input disabled>');
    this.assertStableRerender();

    this.rerender({ isDisabled: false });
    this.assertHTML('<input>');
    this.assertStableRerender();

    this.rerender({ isDisabled: null });
    this.assertHTML('<input>');
    this.assertStableRerender();
  }

  @test "Quoted attribute string values"() {
    this.render("<img src='{{src}}'>", { src: 'image.png' });
    this.assertHTML("<img src='image.png'>");
    this.assertStableRerender();

    this.rerender({ src: 'newimage.png' });
    this.assertHTML("<img src='newimage.png'>");
    this.assertStableNodes();

    this.rerender({ src: '' });
    this.assertHTML("<img src=''>");
    this.assertStableNodes();

    this.rerender({ src: 'image.png' });
    this.assertHTML("<img src='image.png'>");
    this.assertStableNodes();
  }

  @test "Unquoted attribute string values"() {
    this.render("<img src={{src}}>", { src: 'image.png' });
    this.assertHTML("<img src='image.png'>");
    this.assertStableRerender();

    this.rerender({ src: 'newimage.png' });
    this.assertHTML("<img src='newimage.png'>");
    this.assertStableNodes();

    this.rerender({ src: '' });
    this.assertHTML("<img src=''>");
    this.assertStableNodes();

    this.rerender({ src: 'image.png' });
    this.assertHTML("<img src='image.png'>");
    this.assertStableNodes();
  }

  @test "Unquoted img src attribute is not rendered when set to `null`"() {
    this.render("<img src='{{src}}'>", { src: null });
    this.assertHTML("<img>");
    this.assertStableRerender();

    this.rerender({ src: 'newimage.png' });
    this.assertHTML("<img src='newimage.png'>");
    this.assertStableNodes();

    this.rerender({ src: '' });
    this.assertHTML("<img src=''>");
    this.assertStableNodes();

    this.rerender({ src: null });
    this.assertHTML("<img>");
    this.assertStableNodes();
  }

  @test "Unquoted img src attribute is not rendered when set to `undefined`"() {
    this.render("<img src='{{src}}'>", { src: undefined });
    this.assertHTML("<img>");
    this.assertStableRerender();

    this.rerender({ src: 'newimage.png' });
    this.assertHTML("<img src='newimage.png'>");
    this.assertStableNodes();

    this.rerender({ src: '' });
    this.assertHTML("<img src=''>");
    this.assertStableNodes();

    this.rerender({ src: undefined });
    this.assertHTML("<img>");
    this.assertStableNodes();
  }

  @test "Unquoted a href attribute is not rendered when set to `null`"() {
    this.render("<a href={{href}}></a>", { href: null });
    this.assertHTML("<a></a>");
    this.assertStableRerender();

    this.rerender({ href: 'http://example.com' });
    this.assertHTML("<a href='http://example.com'></a>");
    this.assertStableNodes();

    this.rerender({ href: '' });
    this.assertHTML("<a href=''></a>");
    this.assertStableNodes();

    this.rerender({ href: null });
    this.assertHTML("<a></a>");
    this.assertStableNodes();
  }

  @test "Unquoted a href attribute is not rendered when set to `undefined`"() {
    this.render("<a href={{href}}></a>", { href: undefined });
    this.assertHTML("<a></a>");
    this.assertStableRerender();

    this.rerender({ href: 'http://example.com' });
    this.assertHTML("<a href='http://example.com'></a>");
    this.assertStableNodes();

    this.rerender({ href: '' });
    this.assertHTML("<a href=''></a>");
    this.assertStableNodes();

    this.rerender({ href: undefined });
    this.assertHTML("<a></a>");
    this.assertStableNodes();
  }

  @test "Attribute expression can be followed by another attribute"() {
    this.render("<div foo='{{funstuff}}' name='Alice'></div>", { funstuff: "oh my" });
    this.assertHTML("<div name='Alice' foo='oh my'></div>");
    this.assertStableRerender();

    this.rerender({ funstuff: 'oh boy' });
    this.assertHTML("<div name='Alice' foo='oh boy'></div>");
    this.assertStableNodes();

    this.rerender({ funstuff: '' });
    this.assertHTML("<div name='Alice' foo=''></div>");
    this.assertStableNodes();

    this.rerender({ funstuff: "oh my" });
    this.assertHTML("<div name='Alice' foo='oh my'></div>");
    this.assertStableNodes();
  }

  @test "HTML comments"() {
    this.render('<div><!-- Just passing through --></div>');
    this.assertHTML('<div><!-- Just passing through --></div>');
    this.assertStableRerender();
  }

  @test "Curlies in HTML comments"() {
    this.render('<div><!-- {{foo}} --></div>', { foo: 'foo' });
    this.assertHTML('<div><!-- {{foo}} --></div>');
    this.assertStableRerender();

    this.rerender({ foo: 'bar' });
    this.assertHTML('<div><!-- {{foo}} --></div>');
    this.assertStableNodes();

    this.rerender({ foo: '' });
    this.assertHTML('<div><!-- {{foo}} --></div>');
    this.assertStableNodes();

    this.rerender({ foo: 'foo' });
    this.assertHTML('<div><!-- {{foo}} --></div>');
    this.assertStableNodes();
  }

  @test "Complex Curlies in HTML comments"() {
    this.render('<div><!-- {{foo bar baz}} --></div>', { foo: 'foo' });
    this.assertHTML('<div><!-- {{foo bar baz}} --></div>');
    this.assertStableRerender();

    this.rerender({ foo: 'bar' });
    this.assertHTML('<div><!-- {{foo bar baz}} --></div>');
    this.assertStableNodes();

    this.rerender({ foo: '' });
    this.assertHTML('<div><!-- {{foo bar baz}} --></div>');
    this.assertStableNodes();

    this.rerender({ foo: 'foo' });
    this.assertHTML('<div><!-- {{foo bar baz}} --></div>');
    this.assertStableNodes();
  }

  @test "HTML comments with multi-line mustaches"() {
    this.render('<div><!-- {{#each foo as |bar|}}\n{{bar}}\n\n{{/each}} --></div>');
    this.assertHTML('<div><!-- {{#each foo as |bar|}}\n{{bar}}\n\n{{/each}} --></div>');
    this.assertStableRerender();
  }

  @test "Top level comments"() {
    this.render('<!-- {{foo}} -->');
    this.assertHTML('<!-- {{foo}} -->');
    this.assertStableRerender();
  }

  @test "Handlebars comments"() {
    this.render('<div>{{! Better not break! }}content</div>');
    this.assertHTML('<div>content</div>');
    this.assertStableRerender();
  }

  @test "Text curlies"() {
    this.render('<div>{{title}}<span>{{title}}</span></div>', { title: 'hello' });
    this.assertHTML('<div>hello<span>hello</span></div>');
    this.assertStableRerender();

    this.rerender({ title: 'goodbye' });
    this.assertHTML('<div>goodbye<span>goodbye</span></div>');
    this.assertStableNodes();

    this.rerender({ title: '' });
    this.assertHTML('<div><span></span></div>');
    this.assertStableNodes();

    this.rerender({ title: 'hello' });
    this.assertHTML('<div>hello<span>hello</span></div>');
    this.assertStableNodes();
  }

  @test "Text curlies perform escaping"() {
    this.render('<div>{{title}}<span>{{title}}</span></div>', { title: '<strong>hello</strong>' });
    this.assertHTML('<div>&lt;strong&gt;hello&lt;/strong&gt;<span>&lt;strong>hello&lt;/strong&gt;</span></div>');
    this.assertStableRerender();

    this.rerender({ title: '<i>goodbye</i>' });
    this.assertHTML('<div>&lt;i&gt;goodbye&lt;/i&gt;<span>&lt;i&gt;goodbye&lt;/i&gt;</span></div>');
    this.assertStableNodes();

    this.rerender({ title: '' });
    this.assertHTML('<div><span></span></div>');
    this.assertStableNodes();

    this.rerender({ title: '<strong>hello</strong>' });
    this.assertHTML('<div>&lt;strong&gt;hello&lt;/strong&gt;<span>&lt;strong>hello&lt;/strong&gt;</span></div>');
    this.assertStableNodes();
  }

  @test "Node curlies"() {
    let title = document.createElement('span');
    title.innerText = 'hello';
    this.render('<div>{{title}}</div>', { title });
    this.assertHTML('<div><span>hello</span></div>');
    this.assertStableRerender();

    let title2 = document.createElement('span');
    title2.innerText = 'goodbye';
    this.rerender({ title: title2 });
    this.assertHTML('<div><span>goodbye</span></div>');
    this.assertStableNodes({ except: title });

    let title3 = document.createTextNode('');
    this.rerender({ title: title3 });
    this.assertHTML('<div></div>');
    this.assertStableNodes({ except: title2 });

    this.rerender({ title });
    this.assertHTML('<div><span>hello</span></div>');
    this.assertStableNodes({ except: title3 });
  }

  @test "Safe HTML curlies"() {
    let title = { toHTML() { return '<span>hello</span> <em>world</em>'; } };
    this.render('<div>{{title}}</div>', { title });
    this.assertHTML('<div><span>hello</span> <em>world</em></div>');
    this.assertStableRerender();
  }

  @test "Triple curlies"() {
    let title = '<span>hello</span> <em>world</em>';
    this.render('<div>{{{title}}}</div>', { title });
    this.assertHTML('<div><span>hello</span> <em>world</em></div>');
    this.assertStableRerender();
  }

  @test "Top level triple curlies"() {
    let title = '<span>hello</span> <em>world</em>';
    this.render('{{{title}}}', { title });
    this.assertHTML('<span>hello</span> <em>world</em>');
    this.assertStableRerender();
  }

  @test "Top level unescaped tr"() {
    let title = '<tr><td>Yo</td></tr>';
    this.render('<table>{{{title}}}</table>', { title });
    this.assertHTML('<table><tbody><tr><td>Yo</td></tr></tbody></table>');
    this.assertStableRerender();
  }

  @test "Simple blocks"() {
    this.render('<div>{{#if admin}}<p>{{user}}</p>{{/if}}!</div>', { admin: true, user: 'chancancode' });
    this.assertHTML('<div><p>chancancode</p>!</div>');
    this.assertStableRerender();

    let p = this.element.firstChild!.firstChild!;

    this.rerender({ admin: false });
    this.assertHTML('<div><!---->!</div>');
    this.assertStableNodes({ except: p });

    let comment = this.element.firstChild!.firstChild!;

    this.rerender({ admin: true });
    this.assertHTML('<div><p>chancancode</p>!</div>');
    this.assertStableNodes({ except: comment });
  }

  @test "Nested blocks"() {
    this.render('<div>{{#if admin}}{{#if access}}<p>{{user}}</p>{{/if}}{{/if}}!</div>', { admin: true, access: true, user: 'chancancode' });
    this.assertHTML('<div><p>chancancode</p>!</div>');
    this.assertStableRerender();

    let p = this.element.firstChild!.firstChild!;

    this.rerender({ admin: false });
    this.assertHTML('<div><!---->!</div>');
    this.assertStableNodes({ except: p });

    let comment = this.element.firstChild!.firstChild!;

    this.rerender({ admin: true });
    this.assertHTML('<div><p>chancancode</p>!</div>');
    this.assertStableNodes({ except: comment });

    p = this.element.firstChild!.firstChild!;

    this.rerender({ access: false });
    this.assertHTML('<div><!---->!</div>');
    this.assertStableNodes({ except: p });
  }

  @test "Loops"() {
    this.render('<div>{{#each people key="handle" as |p|}}<span>{{p.handle}}</span> - {{p.name}}{{/each}}</div>', {
      people: [
        { handle: 'tomdale', name: 'Tom Dale' },
        { handle: 'chancancode', name: 'Godfrey Chan' },
        { handle: 'wycats', name: 'Yehuda Katz' }
      ]
    });

    this.assertHTML('<div><span>tomdale</span> - Tom Dale<span>chancancode</span> - Godfrey Chan<span>wycats</span> - Yehuda Katz</div>');
    this.assertStableRerender();

    this.rerender({
      people: [
        { handle: 'tomdale', name: 'Thomas Dale' },
        { handle: 'wycats', name: 'Yehuda Katz' }
      ]
    });

    this.assertHTML('<div><span>tomdale</span> - Thomas Dale<span>wycats</span> - Yehuda Katz</div>');
  }
}

module("Initial Render Tests", class extends RenderTest {
  protected element: HTMLDivElement;

  constructor(env = new TestEnvironment()) {
    super(env);
    this.element = env.getDOM().createElement('div') as HTMLDivElement;
  }

  renderTemplate(template: Template<Opaque>): RenderResult {
    return renderTemplate(this.env, template, {
      self: new UpdatableReference(this.context),
      parentNode: this.element,
      dynamicScope: new TestDynamicScope()
    });
  }
});

const OPEN: { marker: 'open-block' } = { marker: 'open-block' };
const CLOSE: { marker: 'close-block' } = { marker: 'close-block' };
const SEP: { marker: 'sep' } = { marker: 'sep' };
const EMPTY: { marker: 'empty' } = { marker: 'empty' };

type Content = string | typeof OPEN | typeof CLOSE | typeof SEP | typeof EMPTY;

function content(list: Content[]): string {
  let out: string[] = [];
  let depth = 0;

  list.forEach(item => {
    if (typeof item === 'string') {
      out.push(item);
    } else if (item.marker === 'open-block') {
      out.push(`<!--%+block:${depth++}%-->`);
    } else if (item.marker === 'close-block') {
      out.push(`<!--%-block:${--depth}%-->`);
    } else {
      out.push(`<!--%${item.marker}%-->`);
    }
  });

  return out.join('');
}

class Rehydration extends RenderTest {
  protected element: HTMLDivElement;
  protected template: Option<Template<Opaque>>;

  constructor(env = new TestEnvironment()) {
    super(env);
    this.element = env.getDOM().createElement('div') as HTMLDivElement;
  }

  @test "mismatched text nodes"() {
    this.setup({ template: "{{content}}" });
    this.renderServerSide({ content: 'hello' });
    this.assertServerOutput("hello");

    this.renderClientSide({ content: 'goodbye' });
    this.assertHTML("goodbye");
    this.assertStableNodes();
    this.assertStableRerender();
  }

  @test "mismatched text nodes (server-render empty)"() {
    this.setup({ template: "{{content}} world" });
    this.renderServerSide({ content: '' });
    this.assertServerOutput(EMPTY, " world");

    this.renderClientSide({ content: 'hello' });
    this.assertHTML("hello world");

    // TODO: handle %empty% in the testing DSL
    // this.assertStableNodes();
    this.assertStableRerender();
  }

  @test "mismatched elements"() {
    this.setup({ template: "{{#if admin}}<div>hi admin</div>{{else}}<p>HAXOR</p>{{/if}}" });
    this.renderServerSide({ admin: true });
    this.assertServerOutput(OPEN, "<div>hi admin</div>", CLOSE);

    this.renderClientSide({ admin: false });
    this.assertHTML("<p>HAXOR</p>");
    this.assertStableRerender();
  }

  @test "extra nodes at the end"() {
    this.setup({ template: "{{#if admin}}<div>hi admin</div>{{else}}<div>HAXOR{{stopHaxing}}</div>{{/if}}" });
    this.renderServerSide({ admin: false, stopHaxing: 'stahp' });
    this.assertServerOutput(OPEN, "<div>HAXOR<!--%sep%-->stahp</div>", CLOSE);

    this.renderClientSide({ admin: true });
    this.assertHTML("<div>hi admin</div>");
    this.assertStableRerender();
  }

  protected setup({ template, context }: { template: string, context?: Dict<Opaque> }) {
    this.template = this.compile(template);
    if (context) this.setProperties(context);
  }

  assertServerOutput(..._expected: Content[]) {
    this.assertHTML(content([OPEN, ..._expected, CLOSE]));
  }

  renderServerSide(context?: Dict<Opaque>): void {
    if (context) { this.context = context; }

    let template = expect(this.template, 'Must set up a template before calling renderServerSide');
    // Emulate server-side render
    renderTemplate(new TestEnvironment(), template, {
      self: new UpdatableReference(this.context),
      parentNode: this.element,
      dynamicScope: new TestDynamicScope(),
      mode: 'serialize'
    });

    this.takeSnapshot();
  }

  renderClientSide(context?: Dict<Opaque>) {
    if (context) { this.context = context; }

    let template = expect(this.template, 'Must set up a template before calling renderClientSide');

    // Client-side rehydration
    this.renderResult = renderTemplate(this.env, template, {
      self: new UpdatableReference(this.context),
      parentNode: this.element,
      dynamicScope: new TestDynamicScope(),
      mode: 'rehydrate'
    });
  }

  renderTemplate(template: Template<Opaque>): RenderResult {
    this.template = template;
    this.renderServerSide();
    this.renderClientSide();
    return this.renderResult!;
  }
}

module("Rehydration Tests", Rehydration);

function test(_target: Object, _name: string, descriptor: PropertyDescriptor): PropertyDescriptor | void {
  let testFunction = descriptor.value as Function;
  descriptor.enumerable = true;
  testFunction['isTest'] = true;
}

function module(name: string, klass: typeof RenderTest & Function): void {
  QUnit.module(`[NEW] ${name}`);

  for (let prop in klass.prototype) {
    const test = klass.prototype[prop];

    if (isTestFunction(test)) {
      QUnit.test(prop, assert => test.call(new klass(), assert));
    }
  }
}

function isTestFunction(value: any): value is (this: RenderTest, assert: typeof QUnit.assert) => void {
  return typeof value === 'function' && value.isTest;
}

function renderTemplate(env: TestEnvironment, template: Template<Opaque>, options: RenderOptions) {
  env.begin();

  let templateIterator = template.render(options);

  let iteratorResult: IteratorResult<RenderResult>;

  do {
    iteratorResult = templateIterator.next();
  } while (!iteratorResult.done);

  let result = iteratorResult.value;

  env.commit();

  return result;
}
