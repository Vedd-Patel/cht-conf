const deleteUiExtensionsLib = require('../lib/delete-ui-extensions');
const environment = require('../lib/environment');

const executeDeleteUiExtensions = async () => {
  let specificExtensions = [];

  if (environment.extraArgs?.length) {
    specificExtensions = environment.extraArgs.filter(arg => !arg.startsWith('--'));
  }

  await deleteUiExtensionsLib.run(specificExtensions);
};

module.exports = executeDeleteUiExtensions;
