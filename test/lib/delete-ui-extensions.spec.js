const chai = require('chai');
const sinon = require('sinon');
const rewire = require('rewire');

const expect = chai.expect;
chai.use(require('chai-as-promised'));

describe('Delete UI Extensions Library', () => {
  let deleteUiExtensionsLib;
  let logStub;
  let pouchStub;
  let dbMock;

  beforeEach(() => {
    deleteUiExtensionsLib = rewire('../../src/lib/delete-ui-extensions');

    // MOCK THE ENVIRONMENT HERE to bypass the "state was not initialized" error
    deleteUiExtensionsLib.__set__('environment', { apiUrl: 'http://localhost:5984' });

    logStub = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub()
    };
    deleteUiExtensionsLib.__set__('log', logStub);

    dbMock = {
      get: sinon.stub(),
      allDocs: sinon.stub(),
      remove: sinon.stub()
    };

    pouchStub = sinon.stub().returns(dbMock);
    deleteUiExtensionsLib.__set__('pouch', pouchStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should log and return if no extensions are found to delete', async () => {
    dbMock.allDocs.resolves({ rows: [] });

    const { run } = deleteUiExtensionsLib;
    await run([]);

    expect(logStub.info.calledWith('No UI extensions found to delete.')).to.be.true;
    expect(dbMock.remove.called).to.be.false;
  });

  it('should delete all extensions if no specific names are provided', async () => {
    dbMock.allDocs.resolves({
      rows: [
        { doc: { _id: 'ui-extension:ext-one', _rev: '1' } },
        { doc: { _id: 'ui-extension:ext-two', _rev: '1' } }
      ]
    });
    dbMock.remove.resolves();

    const { run } = deleteUiExtensionsLib;
    await run([]);

    expect(dbMock.allDocs.calledOnce).to.be.true;
    expect(dbMock.remove.calledTwice).to.be.true;
    expect(logStub.info.calledWith('Deleted UI Extension: ext-one')).to.be.true;
    expect(logStub.info.calledWith('Deleted UI Extension: ext-two')).to.be.true;
  });

  it('should delete only specific extensions when provided', async () => {
    const targetDoc = { _id: 'ui-extension:target-ext', _rev: '1' };
    dbMock.get.withArgs('ui-extension:target-ext').resolves(targetDoc);
    dbMock.remove.resolves();

    const { run } = deleteUiExtensionsLib;
    await run(['target-ext']);

    expect(dbMock.allDocs.called).to.be.false;
    expect(dbMock.get.calledOnceWith('ui-extension:target-ext')).to.be.true;
    expect(dbMock.remove.calledOnceWith(targetDoc)).to.be.true;
  });

  it('should log a warning if a specific extension is not found (404)', async () => {
    const notFoundError = new Error('missing');
    notFoundError.status = 404;
    dbMock.get.rejects(notFoundError);

    const { run } = deleteUiExtensionsLib;
    await run(['missing-ext']);

    expect(logStub.warn.calledWith('UI Extension "missing-ext" not found in database. Skipping.')).to.be.true;
    expect(dbMock.remove.called).to.be.false;
  });

  it('should throw an error if the database removal fails', async () => {
    const targetDoc = { _id: 'ui-extension:broken-ext', _rev: '1' };
    dbMock.get.resolves(targetDoc);
    dbMock.remove.rejects(new Error('CouchDB write error'));

    const { run } = deleteUiExtensionsLib;

    await expect(run(['broken-ext']))
      .to.be.rejectedWith('Failed to delete ui-extension:broken-ext: CouchDB write error');
  });
});
