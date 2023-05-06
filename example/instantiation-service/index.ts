import {createDecorator, ServiceCollection, InstantiationService} from "@seasonjs/instantiation";


const IServiceExample1 = createDecorator<IServiceExample1>('service1');

interface IServiceExample1 {
  readonly _serviceBrand: undefined;
  c: number;
}

class Service1 implements IServiceExample1 {
  declare readonly _serviceBrand: undefined;
  c = 1;
}

const IServiceExample2 = createDecorator<IServiceExample2>('service2');

interface IServiceExample2 {
  readonly _serviceBrand: undefined;
  d: boolean;
}

class Service2 implements IServiceExample2 {
  declare readonly _serviceBrand: undefined;
  d = true;
}

const IServiceExample3 = createDecorator<IServiceExample3>('service3');

interface IServiceExample3 {
  readonly _serviceBrand: undefined;
  s: string;
}

class Service3 implements IServiceExample3 {
  declare readonly _serviceBrand: undefined;
  s = 'farboo';
}

class Service1Consumer {

  constructor(@IServiceExample1 service1: IServiceExample1) {
    console.log(service1)
    console.log(service1.c)
  }
}

const collection = new ServiceCollection();
const service = new InstantiationService(collection);
collection.set(IServiceExample1, new Service1());
collection.set(IServiceExample2, new Service2());
collection.set(IServiceExample3, new Service3());

service.createInstance(Service1Consumer);
