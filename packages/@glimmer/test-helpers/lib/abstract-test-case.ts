import { TagWrapper } from '../../reference/lib/validators';
import { PathReference, Tagged, RevisionTag, DirtyableTag, Tag } from '@glimmer/reference';
import { Template, RenderResult } from '@glimmer/runtime';
import {
  TestEnvironment,
  TestDynamicScope,
  UserHelper
} from './environment';
import { Opaque, dict, expect } from '@glimmer/util';
import { assign, equalTokens } from './helpers';
import { Simple, Option, Dict } from "@glimmer/interfaces";

export function skip(_target: Object, _name: string, descriptor: PropertyDescriptor) {
  descriptor.value['skip'] = true;
}

export class VersionedObject implements Tagged {
  public tag: TagWrapper<DirtyableTag>;
  public value: Object;

  constructor(value: Object) {
    this.tag = DirtyableTag.create();
    assign(this, value);
  }

  update(value: Object) {
    assign(this, value);
    this.dirty();
  }

  set(key: string, value: Opaque) {
    this[key] = value;
    this.dirty();
  }

  dirty() {
    this.tag.inner.dirty();
  }
}

export class SimpleRootReference implements PathReference<Opaque> {
  public tag: TagWrapper<RevisionTag>;

  constructor(private object: VersionedObject) {
    this.tag = object.tag;
  }

  get(key: string): PathReference<Opaque> {
    return new SimplePathReference(this, key);
  }

  value(): Object {
    return this.object;
  }
}

class SimplePathReference implements PathReference<Opaque> {
  public tag: Tag;

  constructor(private parent: PathReference<Opaque>, private key: string) {
    this.tag = parent.tag;
  }

  get(key: string): SimplePathReference {
    return new SimplePathReference(this, key);
  }

  value(): Opaque {
    let parentValue = this.parent.value();
    return parentValue && parentValue[this.key];
  }
}

function isMarker(node: Node) {
  if (node instanceof Comment && node.textContent === '') {
    return true;
  }

  if (node instanceof Text && node.textContent === '') {
    return true;
  }

  return false;
}

type IndividualSnapshot = 'up' | 'down' | Node;
type NodesSnapshot = IndividualSnapshot[];

export abstract class RenderTest {
  protected abstract element: HTMLElement;

  protected assert = QUnit.assert;
  protected context = dict<Opaque>();
  protected renderResult: Option<RenderResult> = null;
  private snapshot: NodesSnapshot = [];

  constructor(protected env = new TestEnvironment()) {}

  registerHelper(name: string, helper: UserHelper) {
    this.env.registerHelper(name, helper);
  }

  protected compile(template: string): Template<Opaque> {
    return this.env.compile(template);
  }

  render(template: string, properties: Dict<Opaque> = {}): void {
    this.setProperties(properties);

    this.renderResult = this.renderTemplate(this.compile(template));
  }

  protected abstract renderTemplate(template: Template<Opaque>): RenderResult;

  rerender(properties: Dict<Opaque> = {}): void {
    this.setProperties(properties);

    this.env.begin();
    expect(this.renderResult, 'the test should call render() before rerender()').rerender();
    this.env.commit();
  }

  protected set(key: string, value: Opaque): void {
    this.context[key] = value;
  }

  protected setProperties(properties: Dict<Opaque>): void {
    Object.assign(this.context, properties);
  }

  protected takeSnapshot() {
    let snapshot: (Node | 'up' | 'down')[] = this.snapshot = [];

    let node = this.element.firstChild;
    let upped = false;

    while (node && node !== this.element) {
      if (upped) {
        if (node.nextSibling) {
          node = node.nextSibling;
          upped = false;
        } else {
          snapshot.push('up');
          node = node.parentNode;
        }
      } else {
        if (!isServerMarker(node)) snapshot.push(node);

        if (node.firstChild) {
          snapshot.push('down');
          node = node.firstChild;
        } else if (node.nextSibling) {
          node = node.nextSibling;
        } else {
          snapshot.push('up');
          node = node.parentNode;
          upped = true;
        }
      }
    }

    return snapshot;
  }

  protected assertStableRerender() {
    this.takeSnapshot();
    this.runTask(() => this.rerender());
    this.assertStableNodes();
  }

  protected assertHTML(html: string) {
    equalTokens(this.element, html);
  }

  private runTask<T>(callback: () => T): T {
    return callback();
  }

  protected assertStableNodes({ except: _except }: { except: Array<Node> | Node | Node[] } = { except: [] }) {
    let except: Array<Node>;

    if (Array.isArray(_except)) {
      except = uniq(_except);
    } else {
      except = [_except];
    }

    let { oldSnapshot, newSnapshot } = normalize(this.snapshot, this.takeSnapshot(), except);

    if (oldSnapshot.length === newSnapshot.length && oldSnapshot.every((item, index) => item === newSnapshot[index])) {
      return;
    }

    this.assert.deepEqual(oldSnapshot, newSnapshot, "DOM nodes are stable");
  }
}

function normalize(oldSnapshot: NodesSnapshot, newSnapshot: NodesSnapshot, except: Array<Node>) {
  let oldIterator = new SnapshotIterator(oldSnapshot);
  let newIterator = new SnapshotIterator(newSnapshot);

  let normalizedOld = [];
  let normalizedNew = [];

  while (true) {
    let nextOld = oldIterator.peek();
    let nextNew = newIterator.peek();

    if (nextOld === null && newIterator.peek() === null) break;

    if ((nextOld instanceof Node && except.indexOf(nextOld) > -1) || (nextNew instanceof Node && except.indexOf(nextNew) > -1)) {
      oldIterator.skip();
      newIterator.skip();
    } else {
      normalizedOld.push(oldIterator.next());
      normalizedNew.push(newIterator.next());
    }
  }

  return { oldSnapshot: normalizedOld, newSnapshot: normalizedNew };
}

class SnapshotIterator {
  private depth = 0;
  private pos = 0;

  constructor(private snapshot: NodesSnapshot) {
  }

  peek(): Option<IndividualSnapshot> {
    if (this.pos >= this.snapshot.length) return null;
    return this.snapshot[this.pos];
  }

  next(): Option<IndividualSnapshot> {
    if (this.pos >= this.snapshot.length) return null;
    return this.nextNode() || null;
  }

  skip(): void {
    let skipUntil = this.depth;
    this.nextNode();

    if (this.snapshot[this.pos] === 'down') {
      do { this.nextNode(); } while (this.depth !== skipUntil);
    }
  }

  private nextNode(): IndividualSnapshot {
    let token = this.snapshot[this.pos++];

    if (token === 'down') {
      this.depth++;
    } else if (token === 'up') {
      this.depth--;
    }

    return token;
  }
}

function uniq(arr: any[]) {
  return arr.reduce((accum, val) => {
    if (accum.indexOf(val) === -1) accum.push(val);
    return accum;
  }, []);
}

function isServerMarker(node: Node) {
  return node.nodeType === Node.COMMENT_NODE && node.nodeValue!.charAt(0) === '%';
}

export class RenderingTest {
  public template: Template<undefined>;
  protected context: Option<VersionedObject> = null;
  private result: Option<RenderResult> = null;
  public snapshot: Node[];
  public element: Option<Node>;
  public assert: typeof QUnit.assert;

  constructor(protected env: TestEnvironment = new TestEnvironment(), template: string, private appendTo: Simple.Element) {
    this.template = this.env.compile(template);
    this.assert = QUnit.config.current.assert;
  }

  teardown() {}

  render(context: Object) {
    this.env.begin();
    let appendTo = this.appendTo;
    let rootObject = new VersionedObject(context);
    let root = new SimpleRootReference(rootObject);

    this.context = rootObject;

    let templateIterator = this.template.render({ self: root, parentNode: appendTo, dynamicScope: new TestDynamicScope() });

    let result;
    do {
      result = templateIterator.next();
    } while (!result.done);

    this.result = result.value;
    this.env.commit();
    this.element = document.getElementById('qunit-fixture')!.firstChild;
  }

  assertContent(expected: string, message?: string) {
    let actual = document.getElementById('qunit-fixture')!.innerHTML;
    QUnit.assert.equal(actual, expected, message || `expected content ${expected}`);
  }

  takeSnapshot() {
    let snapshot: Node[] = this.snapshot = [];
    let node = this.element!.firstChild;

    while (node) {
      if (!isMarker(node)) {
        snapshot.push(node);
      }

      node = node.nextSibling;
    }

    return snapshot;
  }

  assertStableRerender() {
    this.takeSnapshot();
    this.rerender();
    this.assertInvariants();
  }

  rerender() {
    this.result!.rerender();
  }

  assertInvariants(oldSnapshot?: Array<Node>, newSnapshot?: Array<Node>) {
    oldSnapshot = oldSnapshot || this.snapshot;
    newSnapshot = newSnapshot || this.takeSnapshot();

    this.assert.strictEqual(newSnapshot.length, oldSnapshot.length, 'Same number of nodes');

    for (let i = 0; i < oldSnapshot.length; i++) {
      this.assertSameNode(newSnapshot[i], oldSnapshot[i]);
    }
  }

  assertSameNode(actual: Node, expected: Node) {
    this.assert.strictEqual(actual, expected, 'DOM node stability');
  }

  runTask(callback: () => void) {
    callback();
    this.env.begin();
    this.result!.rerender();
    this.env.commit();
  }
}

export function testModule(description?: string) {
  return function(TestClass: typeof RenderingTest) {
    let context: RenderingTest;

    QUnit.module(`[Browser] ${description || TestClass.name}`, {
      afterEach() {
        context.teardown();
      }
    });

    let keys = Object.getOwnPropertyNames(TestClass.prototype);
    keys.forEach(key => {
      if (key === 'constructor') return;
      let value = Object.getOwnPropertyDescriptor(TestClass.prototype, key).value;
      let isSkipped = value.skip;
      if (typeof value === 'function' && !isSkipped) {
        QUnit.test(key, (assert) => {
          let env = new TestEnvironment();
          context = new TestClass(env, value['template'], document.getElementById('qunit-fixture')!);
          value.call(context, assert);
        });
      } else if (isSkipped) {
        QUnit.skip(key, () => {});
      }
    });
  };
}

export function template(t: string) {
  return function template(_target: Object, _name: string, descriptor: PropertyDescriptor) {
    if (typeof descriptor.value !== 'function') {
      throw new Error("Can't decorator a non-function with the @template decorator");
    }

    descriptor.value['template'] = t;
  };
}
