const chai = require('chai');
const sinon = require('sinon');
const rewire = require('rewire');

const expect = chai.expect;

describe('Delete UI Extensions FN Wrapper', () => {
  let executeDeleteUiExtensions;
  let runStub;
  let environmentMock;

  beforeEach(() => {
    executeDeleteUiExtensions = rewire('../../src/fn/delete-ui-extensions');

    runStub = sinon.stub().resolves();
    executeDeleteUiExtensions.__set__('deleteUiExtensionsLib', { run: runStub });

    environmentMock = { extraArgs: [] };
    executeDeleteUiExtensions.__set__('environment', environmentMock);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should call lib run with an empty array if no extra args are provided', async () => {
    await executeDeleteUiExtensions();
    expect(runStub.calledOnceWithExactly([])).to.be.true;
  });

  it('should filter out -- flags and pass specific extensions to lib run', async () => {
    environmentMock.extraArgs = ['extension-one', '--url=http://localhost', 'extension-two'];

    await executeDeleteUiExtensions();

    expect(runStub.calledOnceWithExactly(['extension-one', 'extension-two'])).to.be.true;
  });
});
