import {Emitter, Event} from '../src/base';
import {dispose} from '../src/base';
import {SyncDescriptor} from '../src';
import {createDecorator, IInstantiationService, ServicesAccessor} from '../src/instantiation/instantiation';
import {InstantiationService} from '../src';
import {ServiceCollection} from '../src';
import {describe, expect, test} from "vitest";

const IService1 = createDecorator<IService1>('service1');

interface IService1 {
  readonly _serviceBrand: undefined;
  c: number;
}

class Service1 implements IService1 {
  declare readonly _serviceBrand: undefined;
  c = 1;
}

const IService2 = createDecorator<IService2>('service2');

interface IService2 {
  readonly _serviceBrand: undefined;
  d: boolean;
}

class Service2 implements IService2 {
  declare readonly _serviceBrand: undefined;
  d = true;
}

const IService3 = createDecorator<IService3>('service3');

interface IService3 {
  readonly _serviceBrand: undefined;
  s: string;
}

class Service3 implements IService3 {
  declare readonly _serviceBrand: undefined;
  s = 'farboo';
}

const IDependentService = createDecorator<IDependentService>('dependentService');

interface IDependentService {
  readonly _serviceBrand: undefined;
  name: string;
}

class DependentService implements IDependentService {
  declare readonly _serviceBrand: undefined;

  constructor(@IService1 service: IService1) {
    expect(service.c).toBe(1)
  }

  name = 'farboo';
}

class Service1Consumer {

  constructor(@IService1 service1: IService1) {
    expect(!!service1).toBeTruthy()
    expect(service1.c).toBe(1)
  }
}

class Target2Dep {

  constructor(@IService1 service1: IService1, @IService2 service2: Service2) {
    expect(service1 instanceof Service1).toBeTruthy()
    expect(service2 instanceof Service2).toBeTruthy()
  }
}

class TargetWithStaticParam {
  constructor(v: boolean, @IService1 service1: IService1) {
    expect(v).toBeTruthy()
    expect(!!service1).toBeTruthy()
    expect(service1.c).toBe(1)
  }
}


class DependentServiceTarget {
  constructor(@IDependentService d: IDependentService) {
    expect(!!d).toBeTruthy()
    expect(d.name).toBe('farboo')
  }
}

class DependentServiceTarget2 {
  constructor(@IDependentService d: IDependentService, @IService1 s: IService1) {
    expect(!!d).toBeTruthy()
    expect(d.name).toBe('farboo')
    expect(!!s).toBeTruthy()
    expect(s.c).toBe(1)
  }
}


class ServiceLoop1 implements IService1 {
  declare readonly _serviceBrand: undefined;
  c = 1;

  constructor(@IService2 s: IService2) {

  }
}

class ServiceLoop2 implements IService2 {
  declare readonly _serviceBrand: undefined;
  d = true;

  constructor(@IService1 s: IService1) {

  }
}

describe('Instantiation Service', () => {

  test('service collection, cannot overwrite', function () {
    const collection = new ServiceCollection();
    let result = collection.set(IService1, null!);
    expect(result).toBeUndefined()
    result = collection.set(IService1, new Service1());
    expect(result).toBeNull()
  });

  test('service collection, add/has', function () {
    const collection = new ServiceCollection();
    collection.set(IService1, null!);
    expect(collection.has(IService1)).toBeTruthy()

    collection.set(IService2, null!);
    expect(collection.has(IService1)).toBeTruthy()
    expect(collection.has(IService2)).toBeTruthy()
  });

  test('@Param - simple clase', function () {
    const collection = new ServiceCollection();
    const service = new InstantiationService(collection);
    collection.set(IService1, new Service1());
    collection.set(IService2, new Service2());
    collection.set(IService3, new Service3());

    service.createInstance(Service1Consumer);
  });

  test('@Param - fixed args', function () {
    const collection = new ServiceCollection();
    const service = new InstantiationService(collection);
    collection.set(IService1, new Service1());
    collection.set(IService2, new Service2());
    collection.set(IService3, new Service3());

    service.createInstance(TargetWithStaticParam, true);
  });

  test('service collection is live', function () {

    const collection = new ServiceCollection();
    collection.set(IService1, new Service1());

    const service = new InstantiationService(collection);
    service.createInstance(Service1Consumer);

    collection.set(IService2, new Service2());

    service.createInstance(Target2Dep);
    service.invokeFunction(function (a) {
      expect(!!a.get(IService1)).toBeTruthy()
      expect(!!a.get(IService2)).toBeTruthy()
    });
  });

  // we made this a warning
  // test('@Param - too many args', function () {
  // 	let service = instantiationService.create(Object.create(null));
  // 	service.addSingleton(IService1, new Service1());
  // 	service.addSingleton(IService2, new Service2());
  // 	service.addSingleton(IService3, new Service3());

  // 	assert.throws(() => service.createInstance(ParameterTarget2, true, 2));
  // });

  // test('@Param - too few args', function () {
  // 	let service = instantiationService.create(Object.create(null));
  // 	service.addSingleton(IService1, new Service1());
  // 	service.addSingleton(IService2, new Service2());
  // 	service.addSingleton(IService3, new Service3());

  // 	assert.throws(() => service.createInstance(ParameterTarget2));
  // });

  test('SyncDesc - no dependencies', function () {
    const collection = new ServiceCollection();
    const service = new InstantiationService(collection);
    collection.set(IService1, new SyncDescriptor<IService1>(Service1));

    service.invokeFunction(accessor => {

      const service1 = accessor.get(IService1);
      expect(!!service1).toBeTruthy()
      expect(service1.c).toBe(1)

      const service2 = accessor.get(IService1);
      expect(service1 === service2).toBeTruthy()
    });
  });

  test('SyncDesc - service with service dependency', function () {
    const collection = new ServiceCollection();
    const service = new InstantiationService(collection);
    collection.set(IService1, new SyncDescriptor<IService1>(Service1));
    collection.set(IDependentService, new SyncDescriptor<IDependentService>(DependentService));

    service.invokeFunction(accessor => {
      const d = accessor.get(IDependentService);
      expect(!!d).toBeTruthy()
      expect(d.name).toBe('farboo')
    });
  });

  test('SyncDesc - target depends on service future', function () {
    const collection = new ServiceCollection();
    const service = new InstantiationService(collection);
    collection.set(IService1, new SyncDescriptor<IService1>(Service1));
    collection.set(IDependentService, new SyncDescriptor<IDependentService>(DependentService));

    const d = service.createInstance(DependentServiceTarget);
    expect(d instanceof DependentServiceTarget).toBeTruthy()

    const d2 = service.createInstance(DependentServiceTarget2);
    expect(d2 instanceof DependentServiceTarget2).toBeTruthy()
  });

  test('SyncDesc - explode on loop', function () {
    const collection = new ServiceCollection();
    const service = new InstantiationService(collection);
    collection.set(IService1, new SyncDescriptor<IService1>(ServiceLoop1));
    collection.set(IService2, new SyncDescriptor<IService2>(ServiceLoop2));

    expect(() => service.invokeFunction(accessor => {
      accessor.get(IService1);
    })).toThrowError()

    expect(() => service.invokeFunction(accessor => {
      accessor.get(IService2);
    })).toThrowError()


    try {
      service.invokeFunction(accessor => {
        accessor.get(IService1);
      });
    } catch (err) {
      expect(!!err.name).toBeTruthy()
      expect(!!err.message).toBeTruthy()
    }
  });

  test('Invoke - get services', function () {
    const collection = new ServiceCollection();
    const service = new InstantiationService(collection);
    collection.set(IService1, new Service1());
    collection.set(IService2, new Service2());

    function test(accessor: ServicesAccessor) {
      expect(accessor.get(IService1) instanceof Service1).toBeTruthy()
      expect(accessor.get(IService1).c ).toBe(1)
      return true;
    }

    expect(service.invokeFunction(test)).toBeTruthy();
  });

  test('Invoke - get service, optional', function () {
    const collection = new ServiceCollection([IService1, new Service1()]);
    const service = new InstantiationService(collection);

    function test(accessor: ServicesAccessor) {
      expect(accessor.get(IService1) instanceof Service1).toBeTruthy()
     expect(() => accessor.get(IService2)).toThrowError()
      return true;
    }

    expect(service.invokeFunction(test)).toBeTruthy();
  });

  test('Invoke - keeping accessor NOT allowed', function () {
    const collection = new ServiceCollection();
    const service = new InstantiationService(collection);
    collection.set(IService1, new Service1());
    collection.set(IService2, new Service2());

    let cached: ServicesAccessor;

    function test(accessor: ServicesAccessor) {
      expect(accessor.get(IService1) instanceof Service1).toBeTruthy();
      expect(accessor.get(IService1).c).toBe(1);
      cached = accessor;
      return true;
    }

    expect(service.invokeFunction(test)).toBeTruthy();

    expect(() => cached.get(IService2)).toThrowError();
  });

  test('Invoke - throw error', function () {
    const collection = new ServiceCollection();
    const service = new InstantiationService(collection);
    collection.set(IService1, new Service1());
    collection.set(IService2, new Service2());

    function test(accessor: ServicesAccessor) {
      throw new Error();
    }

    expect(() => service.invokeFunction(test)).toThrowError();
  });

  test('Create child', function () {

    let serviceInstanceCount = 0;

    const CtorCounter = class implements Service1 {
      declare readonly _serviceBrand: undefined;
      c = 1;

      constructor() {
        serviceInstanceCount += 1;
      }
    };

    // creating the service instance BEFORE the child service
    let service = new InstantiationService(new ServiceCollection([IService1, new SyncDescriptor(CtorCounter)]));
    service.createInstance(Service1Consumer);

    // second instance must be earlier ONE
    let child = service.createChild(new ServiceCollection([IService2, new Service2()]));
    child.createInstance(Service1Consumer);

    expect(serviceInstanceCount).toBe(1)

    // creating the service instance AFTER the child service
    serviceInstanceCount = 0;
    service = new InstantiationService(new ServiceCollection([IService1, new SyncDescriptor(CtorCounter)]));
    child = service.createChild(new ServiceCollection([IService2, new Service2()]));

    // second instance must be earlier ONE
    service.createInstance(Service1Consumer);
    child.createInstance(Service1Consumer);

    expect(serviceInstanceCount).toBe(1)
  });

  test('Remote window / integration tests is broken #105562', function () {

    const Service1 = createDecorator<any>('service1');

    class Service1Impl {
      constructor(@IInstantiationService insta: IInstantiationService) {
        const c = insta.invokeFunction(accessor => accessor.get(Service2)); // THIS is the recursive call
        expect(!!c).toBeTruthy()
      }
    }

    const Service2 = createDecorator<any>('service2');

    class Service2Impl {
      constructor() {
      }
    }

    // This service depends on Service1 and Service2 BUT creating Service1 creates Service2 (via recursive invocation)
    // and then Servce2 should not be created a second time
    const Service21 = createDecorator<any>('service21');

    class Service21Impl {
      constructor(@Service2 public readonly service2: Service2Impl, @Service1 public readonly service1: Service1Impl) {
      }
    }

    const insta = new InstantiationService(new ServiceCollection(
      [Service1, new SyncDescriptor(Service1Impl)],
      [Service2, new SyncDescriptor(Service2Impl)],
      [Service21, new SyncDescriptor(Service21Impl)],
    ));

    const obj = insta.invokeFunction(accessor => accessor.get(Service21));
    expect(!!obj).toBeTruthy()
  });

  test('Sync/Async dependency loop', async function () {

    const A = createDecorator<A>('A');
    const B = createDecorator<B>('B');

    interface A {
      _serviceBrand: undefined;

      doIt(): void
    }

    interface B {
      _serviceBrand: undefined;

      b(): boolean
    }

    class BConsumer {
      constructor(@B private readonly b: B) {

      }

      doIt() {
        return this.b.b();
      }
    }

    class AService implements A {
      _serviceBrand: undefined;
      prop: BConsumer;

      constructor(@IInstantiationService insta: IInstantiationService) {
        this.prop = insta.createInstance(BConsumer);
      }

      doIt() {
        return this.prop.doIt();
      }
    }

    class BService implements B {
      _serviceBrand: undefined;

      constructor(@A a: A) {
        expect(!!a).toBeTruthy()
      }

      b() {
        return true;
      }
    }

    // SYNC -> explodes AImpl -> [insta:BConsumer] -> BImpl -> AImpl
    {
      const insta1 = new InstantiationService(new ServiceCollection(
        [A, new SyncDescriptor(AService)],
        [B, new SyncDescriptor(BService)],
      ), true, undefined, true);

      try {
        insta1.invokeFunction(accessor => accessor.get(A));
        expect(false)

      } catch (error) {
        expect(error instanceof Error)
        expect(error.message.includes('RECURSIVELY'))
      }
    }

    // ASYNC -> doesn't explode but cycle is tracked
    {
      const insta2 = new InstantiationService(new ServiceCollection(
        [A, new SyncDescriptor(AService, undefined, true)],
        [B, new SyncDescriptor(BService, undefined)],
      ), true, undefined, true);

      const a = insta2.invokeFunction(accessor => accessor.get(A));
      a.doIt();

      const cycle = insta2._globalGraph?.findCycleSlow();
      expect(cycle).toBe('A -> B -> A')
    }
  });

  test('Delayed and events', function () {
    const A = createDecorator<A>('A');

    interface A {
      _serviceBrand: undefined;
      onDidDoIt: Event<any>;

      doIt(): void;
    }

    let created = false;

    class AImpl implements A {
      _serviceBrand: undefined;
      _doIt = 0;

      _onDidDoIt = new Emitter<this>();
      onDidDoIt: Event<this> = this._onDidDoIt.event;

      constructor() {
        created = true;
      }

      doIt(): void {
        this._doIt += 1;
        this._onDidDoIt.fire(this);
      }
    }

    const insta = new InstantiationService(new ServiceCollection(
      [A, new SyncDescriptor(AImpl, undefined, true)],
    ), true, undefined, true);

    class Consumer {
      constructor(@A public readonly a: A) {
        // eager subscribe -> NO service instance
      }
    }

    const c: Consumer = insta.createInstance(Consumer);
    let eventCount = 0;

    // subscribing to event doesn't trigger instantiation
    const listener = (e: any) => {
      expect(e instanceof AImpl).toBeTruthy()
      eventCount++;
    };
    const d1 = c.a.onDidDoIt(listener);
    const d2 = c.a.onDidDoIt(listener);
    expect(created).toBeFalsy()
    expect(eventCount).toBe(0)
    d2.dispose();

    // instantiation happens on first call
    c.a.doIt();
    expect(created).toBeTruthy()
    expect(eventCount).toBe(1)

    const d3 = c.a.onDidDoIt(listener);
    c.a.doIt();
    expect(eventCount).toBe(3)

    dispose([d1, d3]);
  });
});
