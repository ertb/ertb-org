import agency from '/imports/ui/agency.js';

Template.landingPage.rendered = function() {
  agency($);
}
