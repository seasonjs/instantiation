"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const instantiation_1 = require("@seasonjs/instantiation");
const IServiceExample1 = (0, instantiation_1.createDecorator)('service1');
class Service1 {
    constructor() {
        this.c = 1;
    }
}
const IServiceExample2 = (0, instantiation_1.createDecorator)('service2');
class Service2 {
    constructor() {
        this.d = true;
    }
}
const IServiceExample3 = (0, instantiation_1.createDecorator)('service3');
class Service3 {
    constructor() {
        this.s = 'farboo';
    }
}
let Service1Consumer = class Service1Consumer {
    constructor(service1) {
        console.log(service1);
        console.log(service1.c);
    }
};
Service1Consumer = __decorate([
    __param(0, IServiceExample1)
], Service1Consumer);
const collection = new instantiation_1.ServiceCollection();
const service = new instantiation_1.InstantiationService(collection);
collection.set(IServiceExample1, new Service1());
collection.set(IServiceExample2, new Service2());
collection.set(IServiceExample3, new Service3());
service.createInstance(Service1Consumer);
