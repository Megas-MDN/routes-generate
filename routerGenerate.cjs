const fs = require('fs/promises');
const path = require('path');
const exec = require('child_process').exec;
const rootSrc = path.resolve(__dirname, '..', 'src');
const routerFolder = path.resolve(rootSrc, 'routes');
const controllerFolder = path.resolve(rootSrc, 'controller');
const serviceFolder = path.resolve(rootSrc, 'service');
const repositoryFolder = path.resolve(rootSrc, 'repository');
const testIntegrationFolder = path.resolve(__dirname, '..', 'test', 'integration');

const indexRouteFolder = '_index.ts';
let newResourceName = 'myNewResourceName';

const pointOfTheLastImport = `const appRoutes = Router();`;
const pointOfTheExportRouter = 'export default appRoutes;';
const routeUseName = 'appRoutes.use';
const importMiddleAuth = `import auth from '../middleware/auth';`;
const authName = 'auth';

const customRequest = `import { CustomRequest } from '../../types/custom';`;

console.clear();

const up1 = word => word.charAt(0).toUpperCase() + word.slice(1);
const toLashCase = word =>
  word
    .replace(/([A-Z])/g, '-$1')
    .trim()
    .toLowerCase();

const routeIndexImportGen = async () => {
  // importação da rota no index.ts
  const indexFile = await fs.readFile(path.resolve(routerFolder, indexRouteFolder), 'utf8');
  const newRouteFile = indexFile.split(pointOfTheLastImport);
  const newRouteFileWithImport =
    newRouteFile[0].trim() +
    `\nimport { ${newResourceName}Routes } from './${newResourceName}.routes';\n\n` +
    pointOfTheLastImport +
    newRouteFile[1];

  const newRouteFileWithImportAndExport = newRouteFileWithImport.split(pointOfTheExportRouter);
  const newRouteFileWithImportAndExportWithRoutes =
    newRouteFileWithImportAndExport[0].trim() +
    `\n${routeUseName}(${newResourceName}Routes);\n\n` +
    pointOfTheExportRouter +
    newRouteFileWithImportAndExport[1];
  await fs.writeFile(path.resolve(routerFolder, indexRouteFolder), newRouteFileWithImportAndExportWithRoutes);
};

const routeFileGen = async () => {
  const route = `
import { Router } from 'express';
${importMiddleAuth ? importMiddleAuth : ''}
import { ${up1(newResourceName)}Controller } from '../controller/${up1(newResourceName)}Controller';
import { ${up1(newResourceName)}Service } from '../service/${up1(newResourceName)}Service';
import { ${up1(newResourceName)}Repository } from '../repository/${up1(newResourceName)}Repository';

const ${newResourceName}Routes = Router();

export const make${up1(newResourceName)}Controller = () => {
  const repository = new ${up1(newResourceName)}Repository();
  const service = new ${up1(newResourceName)}Service(repository);
  return new ${up1(newResourceName)}Controller(service);
}

const ${newResourceName}Controller = make${up1(newResourceName)}Controller();

const BASE_PATH = '/${toLashCase(newResourceName)}';
  
${newResourceName}Routes.get(\`\${BASE_PATH}/:id${up1(newResourceName)}}\`${
    authName ? `, ${authName}` : ''
  }, (req, res) => ${newResourceName}Controller.getById(req, res));

export { ${newResourceName}Routes };  
`.trim();
  await fs.writeFile(path.resolve(routerFolder, `${newResourceName}.routes.ts`), route);
};

const controllerFileGen = async () => {
  const controller = `
import { Response${customRequest ? `` : `, Request`} } from 'express';
${customRequest ? customRequest : ''}
import { ${up1(newResourceName)}Service } from '../service/${up1(newResourceName)}Service';

export class ${up1(newResourceName)}Controller {
  constructor(private ${newResourceName}Service: ${up1(newResourceName)}Service) {}

  async getById(req: ${customRequest ? `CustomRequest` : `Request`}, res: Response) {
    const { id${up1(newResourceName)} } = req.params;
    const result = await this.${newResourceName}Service.getById(Number(id${up1(newResourceName)}));
    return res.status(200).json(result);
  }
}
  `.trim();
  await fs.writeFile(path.resolve(controllerFolder, `${up1(newResourceName)}Controller.ts`), controller);
};

const serviceFileGen = async () => {
  const service = `
import { ${up1(newResourceName)}Repository } from '../repository/${up1(newResourceName)}Repository';

export class ${up1(newResourceName)}Service {
  constructor(private ${newResourceName}Repository: ${up1(newResourceName)}Repository) {}

  async getById(id${up1(newResourceName)}: number) {
    return this.${newResourceName}Repository.getById(id${up1(newResourceName)});
  }
}
  `.trim();

  await fs.writeFile(path.resolve(serviceFolder, `${up1(newResourceName)}Service.ts`), service);
};

const repositoryFileGen = async () => {
  const repository = `
import prisma from '../database/client';

export class ${up1(newResourceName)}Repository {
  async getById(id${up1(newResourceName)}: number) {
    console.log({ id${up1(newResourceName)} });
    return { id${up1(newResourceName)}: 'Ok' };
  }
}
  `.trim();

  await fs.writeFile(path.resolve(repositoryFolder, `${up1(newResourceName)}Repository.ts`), repository);
};

const testFileGen = async () => {
  const test = `
import { Response${customRequest ? `` : `, Request`} } from 'express';
${customRequest ? customRequest : ''}
import { ${up1(newResourceName)}Repository } from '../../src/repository/${up1(newResourceName)}Repository';
import { ${up1(newResourceName)}Service } from '../../src/service/${up1(newResourceName)}Service';
import { ${up1(newResourceName)}Controller } from '../../src/controller/${up1(newResourceName)}Controller';

const make${up1(newResourceName)}Controller = () => {
  const repository = new ${up1(newResourceName)}Repository();
  const service = new ${up1(newResourceName)}Service(repository);
  return new ${up1(newResourceName)}Controller(service);
};

describe('${up1(newResourceName)}e Integration', () => {
  let mockRequest: Partial<${customRequest ? `CustomRequest` : `Request`}>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {} as any,
      user: { id_user: 1, id_app: 29, user_name: 'Tester' } as any,
      params: { id${up1(newResourceName)}: '1' },
      query: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(param => param)
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be able to get ${newResourceName}', async () => {
    const ${newResourceName}Controller = make${up1(newResourceName)}Controller();
    const response = await ${newResourceName}Controller.getById(mockRequest as any, mockResponse as any);

    expect(response).toMatchObject({ id${up1(newResourceName)}: 'Ok' });
    expect(mockResponse.json).toBeCalledWith({ id${up1(newResourceName)}: 'Ok' });
    expect(mockResponse.status).toBeCalledWith(200);
  });
});
  `.trim();

  await fs.writeFile(path.resolve(testIntegrationFolder, `${up1(newResourceName)}.test.ts`), test);
};

const setResourceName = () => {
  const indexFlagName = process.argv.findIndex(arg => arg === '--name' || arg === '-n');
  newResourceName =
    indexFlagName > -1
      ? process.argv[indexFlagName + 1]
        ? process.argv[indexFlagName + 1]
        : newResourceName
      : newResourceName;
};
const main = async () => {
  setResourceName();
  await routeIndexImportGen();
  await routeFileGen();
  await controllerFileGen();
  await serviceFileGen();
  await repositoryFileGen();
  await testFileGen();

  exec(`yarn test ${newResourceName}.test.ts`, (error, stdout) => {
    if (error) {
      console.error(`Erro ao executar o arquivo: ${error.message}`);
    }

    console.log(`Saiu com sucesso: ${stdout}`);
  });
};

main();
