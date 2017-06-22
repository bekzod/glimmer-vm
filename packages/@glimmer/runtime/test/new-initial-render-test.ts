import { Opaque, Option, Dict } from "@glimmer/interfaces";
import { Template, RenderResult, SVG_NAMESPACE } from "@glimmer/runtime";
import { TestEnvironment, TestDynamicScope, RenderTest as BaseRenderTest, module, test, renderTemplate, strip, assertNodeTagName } from "@glimmer/test-helpers";
import { UpdatableReference } from "@glimmer/object-reference";
import { expect } from "@glimmer/util";

const XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

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

  @test "HTML selected options"() {
    this.render(strip`
      <select>
        <option>1</option>
        <option selected>2</option>
        <option>3</option>
      </select>
    `);
    this.assertHTML(strip`
      <select>
        <option>1</option>
        <option selected>2</option>
        <option>3</option>
      </select>
    `);
    this.assertStableRerender();
  }

  @test "HTML multi-select options"() {
    this.render(strip`
      <select multiple>
        <option>1</option>
        <option selected>2</option>
        <option selected>3</option>
      </select>
    `);
    this.assertHTML(strip`
      <select multiple>
        <option>1</option>
        <option selected>2</option>
        <option selected>3</option>
      </select>
    `);
    this.assertStableRerender();
  }

  @test "Nested HTML"() {
    this.render("<div class='foo'><p><span id='bar' data-foo='bar'>hi!</span></p></div>&nbsp;More content");
    this.assertHTML("<div class='foo'><p><span id='bar' data-foo='bar'>hi!</span></p></div>&nbsp;More content");
    this.assertStableRerender();
  }

  @test "Custom Elements"() {
    this.render("<use-the-platform></use-the-platform>");
    this.assertHTML("<use-the-platform></use-the-platform>");
    this.assertStableRerender();
  }

  @test "Nested Custom Elements"() {
    this.render("<use-the-platform><seriously-please data-foo='1'>Stuff <div>Here</div></seriously-please></use-the-platform>");
    this.assertHTML("<use-the-platform><seriously-please data-foo='1'>Stuff <div>Here</div></seriously-please></use-the-platform>");
    this.assertStableRerender();
  }

  @test "Moar nested Custom Elements"() {
    this.render("<use-the-platform><seriously-please data-foo='1'><wheres-the-platform>Here</wheres-the-platform></seriously-please></use-the-platform>");
    this.assertHTML("<use-the-platform><seriously-please data-foo='1'><wheres-the-platform>Here</wheres-the-platform></seriously-please></use-the-platform>");
    this.assertStableRerender();
  }

  @test "Custom Elements with dynamic attributes"() {
    this.render("<fake-thing><other-fake-thing data-src='extra-{{someDynamicBits}}-here' /></fake-thing>", { someDynamicBits: 'things' });
    this.assertHTML("<fake-thing><other-fake-thing data-src='extra-things-here' /></fake-thing>");
    this.assertStableRerender();
  }

  @test "Custom Elements with dynamic content"() {
    this.render("<x-foo><x-bar>{{derp}}</x-bar></x-foo>", { derp: 'stuff' });
    this.assertHTML("<x-foo><x-bar>stuff</x-bar></x-foo>");
    this.assertStableRerender();
  }

  @test "Dynamic content within single custom element"() {
    this.render("<x-foo>{{#if derp}}Content Here{{/if}}</x-foo>", { derp: 'stuff' });
    this.assertHTML("<x-foo>Content Here</x-foo>");
    this.assertStableRerender();

    this.rerender({ derp: false });
    this.assertHTML("<x-foo><!----></x-foo>");
    this.assertStableRerender();

    this.rerender({ derp: true });
    this.assertHTML("<x-foo>Content Here</x-foo>");
    this.assertStableRerender();

    this.rerender({ derp: 'stuff' });
    this.assertHTML("<x-foo>Content Here</x-foo>");
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

  @test "Attributes containing a helper are treated like a block"() {
    this.registerHelper('testing', (params) => {
      this.assert.deepEqual(params, [123]);
      return "example.com";
    });

    this.render('<a href="http://{{testing 123}}/index.html">linky</a>');
    this.assertHTML('<a href="http://example.com/index.html">linky</a>');
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

  @test "Dynamic selected options"() {
    this.render(strip`
      <select>
        <option>1</option>
        <option selected={{selected}}>2</option>
        <option>3</option>
      </select>
    `, { selected: true });
    this.assertHTML(strip`
      <select>
        <option>1</option>
        <option>2</option>
        <option>3</option>
      </select>
    `);

    let selectNode: any = this.element.childNodes[1];
    this.assert.equal(selectNode.selectedIndex, 1);
    this.assertStableRerender();

    this.rerender({ selected: false });
    this.assertHTML(strip`
      <select>
        <option>1</option>
        <option>2</option>
        <option>3</option>
      </select>
    `);
    selectNode = this.element.childNodes[1];
    this.assert.equal(selectNode.selectedIndex, 0);
    this.assertStableNodes();

    this.rerender({ selected: '' });
    this.assertHTML(strip`
      <select>
        <option>1</option>
        <option>2</option>
        <option>3</option>
      </select>
    `);
    selectNode = this.element.childNodes[1];
    this.assert.equal(selectNode.selectedIndex, 0);
    this.assertStableNodes();

    this.rerender({ selected: true });
    this.assertHTML(strip`
      <select>
        <option>1</option>
        <option>2</option>
        <option>3</option>
      </select>
    `);
    selectNode = this.element.childNodes[1];
    this.assert.equal(selectNode.selectedIndex, 1);
    this.assertStableNodes();
  }

  @test "Dynamic multi-select"() {
    this.render(strip`
      <select multiple>
        <option>0</option>
        <option selected={{somethingTrue}}>1</option>
        <option selected={{somethingTruthy}}>2</option>
        <option selected={{somethingUndefined}}>3</option>
        <option selected={{somethingNull}}>4</option>
        <option selected={{somethingFalse}}>5</option>
      </select>`,
    {
      somethingTrue: true,
      somethingTruthy: 'is-true',
      somethingUndefined: undefined,
      somethingNull: null,
      somethingFalse: false
    });

    let selectNode = this.element.firstElementChild;
    this.assert.ok(selectNode, 'rendered select');
    if (selectNode === null) {
      return;
    }
    let options = selectNode.querySelectorAll('option');
    let selected: HTMLOptionElement[] = [];
    for (let i = 0; i < options.length; i++) {
      let option = options[i];
      if (option.selected) {
        selected.push(option);
      }
    }

    this.assertHTML(strip`
      <select multiple="">
        <option>0</option>
        <option>1</option>
        <option>2</option>
        <option>3</option>
        <option>4</option>
        <option>5</option>
      </select>`);

    this.assert.equal(selected.length, 2, 'two options are selected');
    this.assert.equal(selected[0].value, '1', 'first selected item is "1"');
    this.assert.equal(selected[1].value, '2', 'second selected item is "2"');
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

  @test "Namespaced attribute"() {
    this.render("<svg xlink:title='svg-title'>content</svg>");
    this.assertHTML("<svg xlink:title='svg-title'>content</svg>");
    this.assertStableRerender();
  }

  @test "<svg> tag with case-sensitive attribute"() {
    this.render('<svg viewBox="0 0 0 0"></svg>');
    this.assertHTML('<svg viewBox="0 0 0 0"></svg>');
    let svg = this.element.firstChild;
    if (assertNodeTagName(svg, 'svg')) {
      this.assert.equal(svg.namespaceURI, SVG_NAMESPACE);
      this.assert.equal(svg.getAttribute('viewBox'), '0 0 0 0');
    }
    this.assertStableRerender();
  }

  @test "nested element in the SVG namespace"() {
    let d = 'M 0 0 L 100 100';
    this.render(`<svg><path d="${d}"></path></svg>`);
    this.assertHTML(`<svg><path d="${d}"></path></svg>`);

    let svg = this.element.firstChild;

    if (assertNodeTagName(svg, 'svg')) {
      this.assert.equal(svg.namespaceURI, SVG_NAMESPACE);

      let path = svg.firstChild;
      if (assertNodeTagName(path, 'path')) {
        this.assert.equal(path.namespaceURI, SVG_NAMESPACE,
              "creates the path element with a namespace");
        this.assert.equal(path.getAttribute('d'), d);
      }
    }

    this.assertStableRerender();
  }

  @test "<foreignObject> tag has an SVG namespace"() {
    this.render('<svg><foreignObject>Hi</foreignObject></svg>');
    this.assertHTML('<svg><foreignObject>Hi</foreignObject></svg>');

    let svg = this.element.firstChild;

    if (assertNodeTagName(svg, 'svg')) {
      this.assert.equal(svg.namespaceURI, SVG_NAMESPACE);

      let foreignObject = svg.firstChild;
      if (assertNodeTagName(foreignObject, 'foreignobject')) {
        this.assert.equal(foreignObject.namespaceURI, SVG_NAMESPACE,
            "creates the foreignObject element with a namespace");
      }
    }

    this.assertStableRerender();
  }

  @test "Namespaced and non-namespaced elements as siblings"() {
    this.render('<svg></svg><svg></svg><div></div>');
    this.assertHTML('<svg></svg><svg></svg><div></div>');

    this.assert.equal(this.element.childNodes[0].namespaceURI, SVG_NAMESPACE,
          "creates the first svg element with a namespace");

    this.assert.equal(this.element.childNodes[1].namespaceURI, SVG_NAMESPACE,
          "creates the second svg element with a namespace");

    this.assert.equal(this.element.childNodes[2].namespaceURI, XHTML_NAMESPACE,
          "creates the div element without a namespace");

    this.assertStableRerender();
  }

  @test "Namespaced and non-namespaced elements with nesting"() {
    this.render('<div><svg></svg></div><div></div>');

    let firstDiv = this.element.firstChild;
    let secondDiv = this.element.lastChild;
    let svg = firstDiv && firstDiv.firstChild;

    this.assertHTML('<div><svg></svg></div><div></div>');

    if (assertNodeTagName(firstDiv, 'div')) {
      this.assert.equal(firstDiv.namespaceURI, XHTML_NAMESPACE,
            "first div's namespace is xhtmlNamespace");
    }

    if (assertNodeTagName(svg, 'svg')) {
      this.assert.equal(svg.namespaceURI, SVG_NAMESPACE,
            "svg's namespace is svgNamespace");
    }

    if (assertNodeTagName(secondDiv, 'div')) {
      this.assert.equal(secondDiv.namespaceURI, XHTML_NAMESPACE,
            "last div's namespace is xhtmlNamespace");
    }

    this.assertStableRerender();
  }

  @test "Case-sensitive tag has capitalization preserved"() {
    this.render('<svg><linearGradient id="gradient"></linearGradient></svg>');
    this.assertHTML('<svg><linearGradient id="gradient"></linearGradient></svg>');
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

  @test "Path expressions"() {
    this.render('<div>{{model.foo.bar}}<span>{{model.foo.bar}}</span></div>', { model: { foo: { bar: 'hello' } } });
    this.assertHTML('<div>hello<span>hello</span></div>');
    this.assertStableRerender();

    this.rerender({ model: { foo: { bar: 'goodbye' } } });
    this.assertHTML('<div>goodbye<span>goodbye</span></div>');
    this.assertStableNodes();

    this.rerender({ model: { foo: { bar: '' } } });
    this.assertHTML('<div><span></span></div>');
    this.assertStableNodes();

    this.rerender({ model: { foo: { bar: 'hello' } } });
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

  @test "Rerender respects whitespace"() {
    this.render('Hello {{ foo }} ', { foo: 'bar'});
    this.assertHTML('Hello bar ');
    this.assertStableRerender();

    this.rerender({ foo: 'baz' });
    this.assertHTML('Hello baz ');
    this.assertStableNodes();

    this.rerender({ foo: '' });
    this.assertHTML('Hello  ');
    this.assertStableNodes();

    this.rerender({ foo: 'bar'});
    this.assertHTML('Hello bar ');
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

  @test "Triple curlie helpers"() {
    this.registerHelper('unescaped', ([param]) => param);
    this.registerHelper('escaped', ([param]) => param);
    this.render('{{{unescaped "<strong>Yolo</strong>"}}} {{escaped "<strong>Yolo</strong>"}}');
    this.assertHTML('<strong>Yolo</strong> &lt;strong&gt;Yolo&lt;/strong&gt;');
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

  @test "Simple helpers"() {
    this.registerHelper('testing', ([id]) => id);
    this.render('<div>{{testing title}}</div>', { title: 'hello' });
    this.assertHTML('<div>hello</div>');
    this.assertStableRerender();
  }

  @test "GH#13999 The compiler can handle simple helpers with inline null parameter"() {
    let value;
    this.registerHelper('say-hello', function(params) {
      value = params[0];
      return 'hello';
    });
    this.render('<div>{{say-hello null}}</div>');
    this.assertHTML('<div>hello</div>');
    this.assert.strictEqual(value, null, 'is null');
    this.assertStableRerender();
  }

  @test "GH#13999 The compiler can handle simple helpers with inline string literal null parameter"() {
    let value;
    this.registerHelper('say-hello', function(params) {
      value = params[0];
      return 'hello';
    });

    this.render('<div>{{say-hello "null"}}</div>');
    this.assertHTML('<div>hello</div>');
    this.assert.strictEqual(value, 'null', 'is null string literal');
    this.assertStableRerender();
  }

  @test "GH#13999 The compiler can handle simple helpers with inline undefined parameter"() {
    let value: Opaque = 'PLACEHOLDER';
    let length;
    this.registerHelper('say-hello', function(params) {
      length = params.length;
      value = params[0];
      return 'hello';
    });

    this.render('<div>{{say-hello undefined}}</div>');
    this.assertHTML('<div>hello</div>');
    this.assert.strictEqual(length, 1);
    this.assert.strictEqual(value, undefined, 'is undefined');
    this.assertStableRerender();
  }

  @test "GH#13999 The compiler can handle simple helpers with positional parameter undefined string literal"() {
    let value: Opaque = 'PLACEHOLDER';
    let length;
    this.registerHelper('say-hello', function(params) {
      length = params.length;
      value = params[0];
      return 'hello';
    });

    this.render('<div>{{say-hello "undefined"}} undefined</div>');
    this.assertHTML('<div>hello undefined</div>');
    this.assert.strictEqual(length, 1);
    this.assert.strictEqual(value, 'undefined', 'is undefined string literal');
    this.assertStableRerender();
  }

  @test "GH#13999 The compiler can handle components with undefined named arguments"() {
    let value: Opaque = 'PLACEHOLDER';
    this.registerHelper('say-hello', function(_, hash) {
      value = hash['foo'];
      return 'hello';
    });

    this.render('<div>{{say-hello foo=undefined}}</div>');
    this.assertHTML('<div>hello</div>');
    this.assert.strictEqual(value, undefined, 'is undefined');
    this.assertStableRerender();
  }

  @test "GH#13999 The compiler can handle components with undefined string literal named arguments"() {
    let value: Opaque = 'PLACEHOLDER';
    this.registerHelper('say-hello', function(_, hash) {
      value = hash['foo'];
      return 'hello';
    });

    this.render('<div>{{say-hello foo="undefined"}}</div>');
    this.assertHTML('<div>hello</div>');
    this.assert.strictEqual(value, 'undefined', 'is undefined string literal');
    this.assertStableRerender();
  }

  @test "GH#13999 The compiler can handle components with null named arguments"() {
    let value;
    this.registerHelper('say-hello', function(_, hash) {
      value = hash['foo'];
      return 'hello';
    });

    this.render('<div>{{say-hello foo=null}}</div>');
    this.assertHTML('<div>hello</div>');
    this.assert.strictEqual(value, null, 'is null');
    this.assertStableRerender();
  }

  @test "GH#13999 The compiler can handle components with null string literal named arguments"() {
    let value;
    this.registerHelper('say-hello', function(_, hash) {
      value = hash['foo'];
      return 'hello';
    });

    this.render('<div>{{say-hello foo="null"}}</div>');
    this.assertHTML('<div>hello</div>');
    this.assert.strictEqual(value, 'null', 'is null string literal');
    this.assertStableRerender();
  }

  @test "Null curly in attributes"() {
    this.render('<div class="foo {{null}}">hello</div>');
    this.assertHTML('<div class="foo ">hello</div>');
    this.assertStableRerender();
  }

  @test "Null in primitive syntax"() {
    this.render('{{#if null}}NOPE{{else}}YUP{{/if}}');
    this.assertHTML('YUP');
    this.assertStableRerender();
  }

  @test "Sexpr helpers"() {
    this.registerHelper('testing', function(params) {
      return params[0] + "!";
    });

    this.render('<div>{{testing (testing "hello")}}</div>');
    this.assertHTML('<div>hello!!</div>');
    this.assertStableRerender();
  }

  @test "The compiler can handle multiple invocations of sexprs" () {
    this.registerHelper('testing', function(params) {
      return "" + params[0] + params[1];
    });

    this.render('<div>{{testing (testing "hello" foo) (testing (testing bar "lol") baz)}}</div>', { foo: "FOO", bar: "BAR", baz: "BAZ" });
    this.assertHTML('<div>helloFOOBARlolBAZ</div>');
    this.assertStableRerender();
  }

  @test "The compiler passes along the hash arguments"() {
    this.registerHelper('testing', function(_, hash) {
      return hash['first'] + '-' + hash['second'];
    });

    this.render('<div>{{testing first="one" second="two"}}</div>');
    this.assertHTML('<div>one-two</div>');
    this.assertStableRerender();
  }

  @test "Attributes can be populated with helpers that generate a string"() {
    this.registerHelper('testing', function(params) {
      return params[0];
    });

    this.render('<a href="{{testing url}}">linky</a>', { url: 'linky.html' });
    this.assertHTML('<a href="linky.html">linky</a>');
    this.assertStableRerender();
  }

  @test "Attribute helpers take a hash"() {
    this.registerHelper('testing', function(_, hash) {
      return hash['path'];
    });

    this.render('<a href="{{testing path=url}}">linky</a>', { url: 'linky.html' });
    this.assertHTML('<a href="linky.html">linky</a>');
    this.assertStableRerender();
  }

  @test "Attributes containing multiple helpers are treated like a block"() {
    this.registerHelper('testing', function(params) {
      return params[0];
    });

    this.render('<a href="http://{{foo}}/{{testing bar}}/{{testing "baz"}}">linky</a>', { foo: 'foo.com', bar: 'bar' });
    this.assertHTML('<a href="http://foo.com/bar/baz">linky</a>');
    this.assertStableRerender();
  }

  @test "Elements inside a yielded block"() {
    this.render('{{#identity}}<div id="test">123</div>{{/identity}}');
    this.assertHTML('<div id="test">123</div>');
    this.assertStableRerender();
  }

  @test "A simple block helper can return text"() {
    this.render('{{#identity}}test{{else}}not shown{{/identity}}');
    this.assertHTML('test');
    this.assertStableRerender();
  }

  @test "A block helper can have an else block"() {
    this.render('{{#render-inverse}}Nope{{else}}<div id="test">123</div>{{/render-inverse}}');
    this.assertHTML('<div id="test">123</div>');
    this.assertStableRerender();
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

class CompileErrorTests extends RenderTest {
  protected element: HTMLDivElement;
  protected template: Option<Template<Opaque>>;

  constructor(env = new TestEnvironment()) {
    super(env);
    this.element = env.getDOM().createElement('div') as HTMLDivElement;
  }

  @test "A helpful error message is provided for unclosed elements"() {
    this.assert.throws(() => {
      this.compile('\n<div class="my-div" \n foo={{bar}}>\n<span>\n</span>\n');
    }, /Unclosed element `div` \(on line 2\)\./);

    this.assert.throws(() => {
      this.compile('\n<div class="my-div">\n<span>\n');
    }, /Unclosed element `span` \(on line 3\)\./);
  }

  @test "A helpful error message is provided for unmatched end tags"() {
    this.assert.throws(() => {
      this.compile("</p>");
    }, /Closing tag `p` \(on line 1\) without an open tag\./);

    this.assert.throws(() => {
      this.compile("<em>{{ foo }}</em> \n {{ bar }}\n</div>");
    }, /Closing tag `div` \(on line 3\) without an open tag\./);
  }

  @test "A helpful error message is provided for end tags for void elements"() {
    this.assert.throws(() => {
      this.compile("<input></input>");
    }, /Invalid end tag `input` \(on line 1\) \(void elements cannot have end tags\)./);

    this.assert.throws(() => {
      this.compile("<div>\n  <input></input>\n</div>");
    }, /Invalid end tag `input` \(on line 2\) \(void elements cannot have end tags\)./);

    this.assert.throws(() => {
      this.compile("\n\n</br>");
    }, /Invalid end tag `br` \(on line 3\) \(void elements cannot have end tags\)./);
  }

  @test "A helpful error message is provided for end tags with attributes"() {
    this.assert.throws(() => {
      this.compile('<div>\nSomething\n\n</div foo="bar">');
    }, /Invalid end tag: closing tag must not have attributes, in `div` \(on line 4\)\./);
  }

  @test "A helpful error message is provided for mismatched start/end tags"() {
    this.assert.throws(() => {
      this.compile("<div>\n<p>\nSomething\n\n</div>");
    }, /Closing tag `div` \(on line 5\) did not match last open tag `p` \(on line 2\)\./);
  }

  @test "error line numbers include comment lines"() {
    this.assert.throws(() => {
      this.compile("<div>\n<p>\n{{! some comment}}\n\n</div>");
    }, /Closing tag `div` \(on line 5\) did not match last open tag `p` \(on line 2\)\./);
  }

  @test "error line numbers include mustache only lines"() {
    this.assert.throws(() => {
      this.compile("<div>\n<p>\n{{someProp}}\n\n</div>");
    }, /Closing tag `div` \(on line 5\) did not match last open tag `p` \(on line 2\)\./);
  }

  @test "error line numbers include block lines"() {
    this.assert.throws(() => {
      this.compile("<div>\n<p>\n{{#some-comment}}\n{{/some-comment}}\n</div>");
    }, /Closing tag `div` \(on line 5\) did not match last open tag `p` \(on line 2\)\./);
  }

  @test "error line numbers include whitespace control mustaches"() {
    this.assert.throws(() => {
      this.compile("<div>\n<p>\n{{someProp~}}\n\n</div>{{some-comment}}");
    }, /Closing tag `div` \(on line 5\) did not match last open tag `p` \(on line 2\)\./);
  }

  @test "error line numbers include multiple mustache lines"() {
    this.assert.throws(() => {
      this.compile("<div>\n<p>\n{{some-comment}}</div>{{some-comment}}");
    }, /Closing tag `div` \(on line 3\) did not match last open tag `p` \(on line 2\)\./);
  }

  @test "Block params in HTML syntax - Throws exception if given zero parameters"() {
    this.assert.throws(() => {
      this.compile('<x-bar as ||>foo</x-bar>');
    }, /Cannot use zero block parameters: 'as \|\|'/);

    this.assert.throws(() => {
      this.compile('<x-bar as | |>foo</x-bar>');
    }, /Cannot use zero block parameters: 'as \| \|'/);
  }

  @test "Block params in HTML syntax - Throws an error on invalid block params syntax"() {
    this.assert.throws(() => {
      this.compile('<x-bar as |x y>{{x}},{{y}}</x-bar>');
    }, /Invalid block parameters syntax: 'as |x y'/);

    this.assert.throws(() => {
      this.compile('<x-bar as |x| y>{{x}},{{y}}</x-bar>');
    }, /Invalid block parameters syntax: 'as \|x\| y'/);

    this.assert.throws(() => {
      this.compile('<x-bar as |x| y|>{{x}},{{y}}</x-bar>');
    }, /Invalid block parameters syntax: 'as \|x\| y\|'/);
  }

  @test "Block params in HTML syntax - Throws an error on invalid identifiers for params"() {
    this.assert.throws(() => {
      this.compile('<x-bar as |x foo.bar|></x-bar>');
    }, /Invalid identifier for block parameters: 'foo\.bar' in 'as \|x foo\.bar|'/);

    this.assert.throws(() => {
      this.compile('<x-bar as |x "foo"|></x-bar>');
    }, /Syntax error at line 1 col 17: " is not a valid character within attribute names/);

    this.assert.throws(() => {
      this.compile('<x-bar as |foo[bar]|></x-bar>');
    }, /Invalid identifier for block parameters: 'foo\[bar\]' in 'as \|foo\[bar\]\|'/);
  }

  @test "Unquoted attribute with expression throws an exception"() {
    this.assert.throws(() => this.compile('<img class=foo{{bar}}>'), expectedError(1));
    this.assert.throws(() => this.compile('<img class={{foo}}{{bar}}>'), expectedError(1));
    this.assert.throws(() => this.compile('<img \nclass={{foo}}bar>'), expectedError(2));
    this.assert.throws(() => this.compile('<div \nclass\n=\n{{foo}}&amp;bar ></div>'), expectedError(4));

    function expectedError(line: number) {
      return new Error(
        `An unquoted attribute value must be a string or a mustache, ` +
        `preceeded by whitespace or a '=' character, and ` +
        `followed by whitespace, a '>' character, or '/>' (on line ${line})`
      );
    }
  }

  renderTemplate(template: Template<Opaque>): RenderResult{
    return renderTemplate(this.env, template, {
      self: new UpdatableReference(this.context),
      parentNode: this.element,
      dynamicScope: new TestDynamicScope()
    });
  }
}

module("Rehydration Tests", Rehydration);
module("Rendering Error Cases", CompileErrorTests);
