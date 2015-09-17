import tapeCss_ from './module';

const test = require('tape-catch');
const clone = require('clone');
const {freeze} = Object;
const {jsdom} = require('jsdom');

const tape = require('tape');

test('Doesn’t modify the `tape` instance', (is) => {
  const tapeClone = clone(tape);
  freeze(tapeClone.Test);
  freeze(tapeClone);

  is.doesNotThrow(
    () => tapeCss_(tapeClone),
    'doesn’t attempt to change any property'
  );

  is.end();
});

test('Doesn’t change the `tape` API', (is) => {
  const localTape = tape.createHarness({exit: false});
  const localTapeCss = tapeCss_(localTape);

  const tapStream = localTape.createStream({objectMode: true});

  is.plan(13);

  localTapeCss('1', (localIs) => {
    is.fail('`tape.only` works as before');
    localIs.end();
  });

  localTapeCss.only('2', (localIs) => {
    localIs.pass();
    localIs.ok(true);
    localIs.notOk(false);
    localIs.equal(1, 1);
    localIs.deepEqual([1], [1]);
    localIs.throws(() => { throw new Error('whatever'); });

    localIs.comment('Yeeaah!');
    localIs.skip('Whooah!');

    localIs.fail();
    localIs.ok(false);
    localIs.deepEqual([1], [2]);

    localIs.end();
  });

  const registerStreams = [
    ({type}) => is.equal(
      type, 'test',
      '`tape` works as before'
    ),

    ({operator, ok}) => is.deepEqual(
      [operator, ok],
      ['pass', true],
      '`t.pass` succeeds as before'
    ),

    ({operator, ok}) => is.deepEqual(
      [operator, ok],
      ['ok', true],
      '`t.ok` succeeds as before'
    ),

    ({operator, ok}) => is.deepEqual(
      [operator, ok],
      ['notOk', true],
      '`t.notOk` succeeds as before'
    ),

    ({operator, ok}) => is.deepEqual(
      [operator, ok],
      ['equal', true],
      '`t.equal` succeeds as before'
    ),

    ({operator, ok}) => is.deepEqual(
      [operator, ok],
      ['deepEqual', true],
      '`t.deepEqual` succeeds as before'
    ),

    ({operator, ok}) => is.deepEqual(
      [operator, ok],
      ['throws', true],
      '`t.throws` succeeds as before'
    ),

    (data) => is.equal(
      data,
      'Yeeaah!',
      '`t.comment` outputs as before'
    ),

    ({operator, skip}) => is.deepEqual(
      [operator, skip],
      ['skip', true],
      '`t.skip` skips as before'
    ),

    ({operator, ok}) => is.deepEqual(
      [operator, ok],
      ['fail', false],
      '`t.fail` fails as before'
    ),

    ({operator, ok}) => is.deepEqual(
      [operator, ok],
      ['ok', false],
      '`t.ok` fails as before'
    ),

    ({operator, ok}) => is.deepEqual(
      [operator, ok],
      ['deepEqual', false],
      '`t.deepEqual` fails as before'
    ),

    ({type}) => is.deepEqual(
      type,
      'end',
      '`t.end` ends as before'
    ),
  ].reduceRight(
    (callback, assertion) => () => tapStream.once('data', (data) => {
      assertion(data);
      callback();
    }),
    () => {}
  );

  registerStreams();
});

const doc = (typeof window !== 'undefined' && window.window === window ?
  window.document :
  jsdom('<!DOCTYPE html>').defaultView.document
);

test('Adds and removes DOM', (is) => {
  const blindTape = tape.createHarness({exit: false});
  const tapeCss = tapeCss_(blindTape);
  blindTape.createStream();  // We don’t need to test the output of `tapeCss`.

  is.plan(7);

  const span = doc.createElement('span');

  tapeCss('Whatever', {
    dom: span,
    document: doc,
  }, (localIs) => {
    is.equal(
      span.parentNode,
      doc.body,
      'inserts a single element to the <body>'
    );

    localIs.end();

    is.notOk(
      doc.body.contains(span),
      'removes the single element from the <body>'
    );
  });

  const tree = doc.createDocumentFragment();
  const button = doc.createElement('button');
  const p = doc.createElement('p');
  const div = doc.createElement('div');

  tree.appendChild(button);
  p.appendChild(div);
  tree.appendChild(p);

  tapeCss('Whatever', {
    dom: tree,
    document: doc,
  }, (localIs) => {
    is.ok(
      doc.body.contains(button) &&
      doc.body.contains(p) &&
      doc.body.contains(div),
      'inserts a whole DOM tree to the <body>'
    );

    is.equal(
      button.parentNode,
      doc.body,
      'puts every element of the tree directly in the <body>'
    );

    is.equal(
      div.parentNode,
      p,
      'keeps the internal DOM structure'
    );

    localIs.end();

    is.notOk(
      doc.body.contains(button) ||
      doc.body.contains(p) ||
      doc.body.contains(div),
      'removes the whole tree from the <body> after the test'
    );

    is.equal(
      div.parentNode,
      p,
      'doesn’t screw up the DOM structure while at it'
    );
  });
});

test.skip('Adds and removes styles', (is) => {
  is.end();
});

test.skip('`test.only` works as they say in the ads', (is) => {
  is.end();
});
