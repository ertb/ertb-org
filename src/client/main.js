import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'

import tether from 'tether'
global.Tether = tether


import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
//import 'bootstrap/dist/css/bootstrap-theme.css'

import '../imports/ui/agency.css'

import 'jquery.easing'

/*
Template.hello.onCreated(function helloOnCreated() {
  // counter starts at 0
  this.counter = new ReactiveVar(0)
})

Template.hello.helpers({
  counter() {
    return Template.instance().counter.get()
  },
})

Template.hello.events({
  'click button'(event, instance) {
    // increment the counter when button is clicked
    instance.counter.set(instance.counter.get() + 1)
  },
})
*/
