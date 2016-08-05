var firebase;
var db;
var deducible;
var cargoFijoArr = [];
//////Formato de moneda
var formatNumber = {
  separador: ",", // separador para los miles
  sepDecimal: '.', // separador para los decimales
  formatear:function (num){
    num +='';
    var splitStr = num.split(',');
    var splitLeft = splitStr[0];
    var splitRight = splitStr.length > 1 ? this.sepDecimal + splitStr[1] : '';
    var regx = /(\d+)(\d{3})/;
    while (regx.test(splitLeft)) {
      splitLeft = splitLeft.replace(regx, '$1' + this.separador + '$2');
    }
    return this.simbol + splitLeft  +splitRight;
  },
  new:function(num, simbol){
    this.simbol = simbol ||'';
    return this.formatear(num);
  }
}

$(document).ready(function() {
  $("#divResumen").hide();

  //Ckech mark SVG icon point
  var svg_valid_icon = "21.4,4.7 21.4,4.7 21.4,4.7 18.6,7.5 18.6,7.5 8.7,17.4 3,11.7 0,14.5 5.9,20.2 8.7,23 20.2,11.5 24.2,7.5";

  //Arrow SVG icon point
  var svg_arrow_icon = "17.4,8.7 17.4,8.7 8.7,0 5.9,2.8 14.6,11.5 8.7,17.4 8.8,17.3 5.8,20.1 5.9,20.2 8.7,23 20.2,11.5 20.2,11.5";

  //Form steps number
  var list_elem_count = $("#steps fieldset").length;

  //Steps navigation position
  var navigation_pos;

  //Enable/Disable consecutive click/keypress event
  var clickable_btn = true;


  init();
  initFirebase();
  function init() {
    add_navigation();

    var next_step_btn_width = $("#navigation li.current_nav").outerWidth();

    var navigation_parent_width = $('#navigation').parent().width();

    navigation_pos = (navigation_parent_width / 2) - ((next_step_btn_width / 2) + 5);

    $('#navigation').css({
      'marginLeft': navigation_pos + 5
    });

    update_progress(1);

    focus_inupt(0);
  }

  //Click next step btn event
  $('#navigation li').on('click', function(e) {
    execute_event($(this).index());
  });

  //Enter keybard press event
  $(document).on('keypress', function(e) {
    var keyCode = e.keyCode || e.which
    if (keyCode === 13) {
      var current_step_idx = $('#navigation li.current_nav').index();
      execute_event(current_step_idx);
    }
});{}

  //Function to start the animation
  function execute_event(idx) {
    if (!clickable_btn || !$('#navigation li').eq(idx).hasClass('current_nav')) {
      return false;
    }
    var inputsValidate = validate_form(idx);
    var error = 0;
    for (var i = 0; i < inputsValidate.length; i++) {
        if (!inputsValidate[i]) {
            show_error(idx, i);
            error ++;
        }
    }
    if (error == 0) {
      clickable_btn = false;
      clear_error();
      if (idx < list_elem_count - 1) {
        navigation_pos = navigation_pos - 20;
      }
      animate_navigation(idx + 1, navigation_pos);
    }
  }

  //Function to animate the clicked button  & the SVG icon
  function animate_navigation(btn_index, new_pos) {
    var s = Snap('.current_nav .arrow');

    $('#navigation li').eq(btn_index - 1).addClass('animate');

    s.stop().animate({
      'points': svg_valid_icon
    }, 150, mina.easeout, function() {
      if (btn_index < list_elem_count) {

        $(".arrow").velocity("fadeOut", {
          delay: 200,
          duration: 200,
          complete: function() {
            update_nav_position(btn_index, new_pos);
            $(this).eq(btn_index).css({
              "opacity": 1
            });
            clickable_btn = true;
          }
        });

      } else if (btn_index == list_elem_count) {

        update_nav_position(btn_index, new_pos);
        form_ready();

      }
    });
  }

  //Update the navigation position
  function update_nav_position(el_index, new_pos) {
    $('#navigation').velocity({
      marginLeft: new_pos
    }, 200);
    $('#navigation li').eq(el_index).addClass('current_nav').siblings().removeClass('current_nav animate');
    $('#navigation li').eq(el_index - 1).addClass('valid');

    if (el_index <= list_elem_count - 1) {
      $('#navigation li').eq(list_elem_count - 1).addClass('submit');
      next_step(el_index);
      focus_inupt(el_index);
    }
  }

  //Function to validte the form
  function validate_form(step_index) {
      var isPortafolios = $("#steps fieldset.current_step").attr("id");
      var currentInputs = $('#steps fieldset.current_step input');
      var valid=[];

      if (isPortafolios == "portafolios") {
          var sum = 0;
          for (var i = 0; i < currentInputs.length; i++) {
              sum += Number($('#steps fieldset.current_step input').eq(i).val());
          }
          if (sum == 100) {
              valid.push(true);
          } else {
              valid.push(false);
          }
      } else {
          for (var i = 0; i < currentInputs.length; i++) {
              if ($('#steps fieldset.current_step input').eq(i).attr('required') == 'required') {
                  if ($('#steps fieldset.current_step input').eq(i).val() != '') {
                    valid[i]=true;
                  } else {
                    valid[i] = false;
                  }
              }
              if (valid[i] == true) {
                  if ($('#steps fieldset.current_step input').eq(i).attr('min') != undefined && $('#steps fieldset.current_step input').eq(i).attr('max') != undefined) {
                      if (Number($('#steps fieldset.current_step input').eq(i).val()) >= Number($('#steps fieldset.current_step input').eq(i).attr('min')) &&
                          Number($('#steps fieldset.current_step input').eq(i).val()) <= Number($('#steps fieldset.current_step input').eq(i).attr('max'))) {
                          valid[i] = true;
                      } else {
                          valid[i] = false;
                      }
                  }
              }
          }
      }

      return valid;
  }

  //Function to focus on the form inputs
  function focus_inupt(input_idx) {
      if ($('#steps fieldset input').length != 0) {
      //$('#steps fieldset input').eq(input_idx).focus();
      } else {
          return false;
      }
  }

  //Function to add navigation
  function add_navigation() {
    if (list_elem_count == 0) {
      return false;
    }

    var pag_markup = '<div class="navigation_container"><ul class="clearfix" id="navigation">';
    var icon_markup = '<div class="icon" id="icon_wrapper"><svg x="0px" y="0px" width="24.3px" height="23.2px" viewBox="0 0 24.3 23.2" enable-background="new 0 0 24.3 23.2" xml:space="preserve"><polygon class="arrow" fill="#ffffff" points="' + svg_arrow_icon + '"></svg></div>';

    for (var i = 1; i <= list_elem_count; i++) {
      pag_markup = pag_markup + '<li>' + icon_markup + '</li>';
    };

    $('#steps').after(pag_markup + '</div>');
    $('#navigation li').eq(0).addClass('current_nav');
  }

  //Function to show the next step
  function next_step(idx) {
    $('#steps fieldset').eq(idx - 1).removeClass('current_step');
    $('#steps fieldset').eq(idx).addClass('current_step');

    update_progress(idx + 1);
  }

  //Function to show errors on the form & navigation
  function show_error(index, indexInput) {
    $('#navigation li').eq(index).addClass('error animate');
    $('#steps fieldset input').eq(indexInput).addClass('invalid');
  }

  //Function to clear the errors on the form & navigation
  function clear_error() {
    $('#navigation li').removeClass('error');
    $('#steps fieldset input').removeClass('invalid');
  }

  //Function to send the form or show a message
  function form_ready() {
      ////Esto es lo de antes

              var plazo = $("#selectPlazo").val();
              var edad = Number($("#age").val());
              var aportacion = $("#aportacion").val();
              var periodicidad = $("#periodicidad option:selected").val();
              var inflacion = $("#inflacion option:selected").val();

              deducible = new Deducible(edad, aportacion, periodicidad, plazo, inflacion);

              var aportacionAnual;
              var edadFinal;

              getSaldoInicialDeducible();
              getSaldoComprometidoDeducible();
              getSaldoFinalBonoDEducible();
              getBeneficioDedicible();

              for (var i = 1; i <= plazo; i++) {
                  var tr = document.createElement("tr");
                  for (var j = 0; j < 8; j++) {
                      var td = document.createElement("td");
                      switch (j) {
                          case 0:
                              td.textContent = i;
                              break;
                          case 1:
                              edadFinal = Number($("#age").val()) + i
                              td.textContent = edadFinal;
                              break;
                          case 2:
                              if (deducible.inflacion == 0) {
                                aportacionAnual = aportacion * periodicidad;
                              } else {
                                if (i == 1) {
                                  aportacionAnual = aportacion * periodicidad;
                                } else {
                                  var incremento = aportacionAnual * .04;
                                  aportacionAnual += incremento;
                                }
                              }
                              td.textContent = formatNumber.new(aportacionAnual.toFixed(0), "$");
                              break;
                          case 3:
                              var aportacionAcomulada;
                              if (i == 1) {
                                aportacionAcomulada = aportacionAnual;
                              } else {
                                aportacionAcomulada += aportacionAnual;
                              }
                              td.textContent = formatNumber.new(aportacionAcomulada.toFixed(0), "$");
                              break;
                          case 4:
                              td.id = "saldoFondo_" + i;
                              break;
                          case 5:
                              td.id = "saldoDisponible_" + i;
                              break;
                          case 6:
                              td.id = "saldoDisponibleNeto_" + i;
                              break;
                          case 7:
                              td.id = "beneficio_" + i;
                              break;
                      }
                      tr.appendChild(td);
                  }
                  $("#tableDetalle").append(tr);
              }
              $("#aportacionAcomulada").html(formatNumber.new(aportacionAcomulada.toFixed(0), "$"));
              $("#edadProyectada").html(edadFinal);

              db.ref("SaldoFondo").on("value", function (snapshot) {
                  var value = snapshot.val();
                  for (var i = 0; i < value.Bono.length; i++) {
                      var saldoFondo = value.Bono[i][12] + value.Comprometido[i][12] + value.Inicial[i][12];
                      var año = i + 1;
                      $("#saldoFondo_" + año).html(formatNumber.new(saldoFondo, "$"));
                      var saldoDisponible;
                      if (año == value.Bono.length) {
                        saldoDisponible = saldoFondo;
                        $("#saldoProyectado").html(formatNumber.new(saldoFondo, "$"));
                      } else {
                        saldoDisponible = value.Comprometido[i][12];
                      }
                      $("#saldoDisponible_" + año).html(formatNumber.new(saldoDisponible, "$"));

                      var saldoDisponibleNeto;
                      // TODO: validar que la edad proyectada en el año calculando sea menor a 65
                      saldoDisponibleNeto = saldoDisponible * .8;
                      saldoDisponibleNeto = Number(saldoDisponibleNeto.toFixed(0));

                      $("#saldoDisponibleNeto_" + año).html(formatNumber.new(saldoDisponibleNeto, "$"));
                  }
              });

              db.ref("BeneficioDeducibilidad").on("value", function (snapshot) {
                var value = snapshot.val();
                for (var i = 0; i < value.length; i++) {
                  var año = i + 1;
                  $("#beneficio_" + año).html(formatNumber.new(value[i], "$"));
                }
              });
      ///////////////////////
    $("#divForm").hide();
    $("#divResumen").show();
  }

  //Function to update step number(visible on small size screens)
  function update_progress(idx) {
    $('.step_nb').text(idx + '/' + list_elem_count);
  }

  var selectPlazo = document.createElement("select");
  selectPlazo.id = "selectPlazo";
  for (var i = 0; i <= 20; i++) {
      var option = document.createElement("option");
      option.value = i + 5;
      option.text = i + 5;
      selectPlazo.add(option);
  }
  $("#divSelectPlazo").append(selectPlazo);
  $('select').material_select();

  firebase.auth().onAuthStateChanged(function(user) {
    console.log("user : ", user);
    if (user) {
      console.log("usuario autenticado");
      user.providerData.forEach(function (profile) {
        db.ref("Usuarios").child(user.uid).set({
          email: profile.email,
          name: profile.displayName,
          provider: profile.providerId
        });
        user.updateEmail(profile.email).then(function() {
          // Update successful.
        }, function(error) {
          // An error happened.
          console.log("updateEmail error", error);
        });
      });

      $("#divForm").show();
      $("#logout").show();
      $("#loginfacebook").hide();

      $("#name").val(user.providerData[0].displayName);
    } else {
      $("#divForm").hide()
      $("#logout").hide();;
      $("#loginfacebook").show();
      console.log("no autenticado");
    }
  });

});

function initFirebase() {
  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyCufTHs0x-dMvcKfPJi0ETYQWMcY-vVk8Q",
    authDomain: "cotizadorprevilife.firebaseapp.com",
    databaseURL: "https://cotizadorprevilife.firebaseio.com",
    storageBucket: "",
  };
  firebase.initializeApp(config);
  db = firebase.database();
}

function Deducible(edad, aportacion, periodicidad, plazo, inflacion){
  this.edad = Number(edad);
  this.aportacion = Number(aportacion);
  this.periodicidad = Number(periodicidad);
  this.plazo = Number(plazo);
  this.inflacion = Number(inflacion);
}

function getBeneficioDedicible() {
  var aportacionAnual;
  var intialTope151 = 98243.40;
  var tope151;
  var topeAnterior;
  var base151;
  var isr = $("#isr option:selected").val();
  var beneficio;
  var beneficioAnterior;
  var beneficioArr =[];
  for (var i = 1; i <= deducible.plazo; i++) {
    if (deducible.inflacion == 0) {
      aportacionAnual = deducible.aportacion * deducible.periodicidad;
    } else {
      if (i == 1) {
        aportacionAnual = deducible.aportacion * deducible.periodicidad;
      } else {
        var incremento = aportacionAnual * .04;
        aportacionAnual += incremento;
      }
    }

    if (i == 1) {
      tope151 = intialTope151;
    } else {
      tope151 = topeAnterior * (1 + .04);
    }

    topeAnterior = tope151;
    if (aportacionAnual > tope151) {
      base151 = tope151;
    } else {
      base151 = aportacionAnual;
    }

    if (i == 1) {
       beneficio = base151 * isr;
    } else {
      beneficio = (base151 * isr) + (beneficioAnterior * (1 + .09));
    }
    beneficioAnterior = beneficio;
    beneficioArr.push(beneficio.toFixed(0));
  }
  db.ref("BeneficioDeducibilidad").set(beneficioArr);
}

function getSaldoFinalBonoDEducible() {
    var aportacionAnual = deducible.aportacion * deducible.periodicidad;
    var buscar;
    var saldoFinalBonoArr;
    if (aportacionAnual < 12000) {
        buscar = 0;
    } else if (aportacionAnual == 12000 || aportacionAnual < 36000) {
        buscar = 12000;
    } else if (aportacionAnual == 36000 || aportacionAnual < 60000) {
        buscar = 36000;
    } else if (aportacionAnual == 60000 || aportacionAnual < 90000) {
        buscar = 60000;
    }else {
        buscar = 90000;
    }
    db.ref("tablaBonos/plazo" + deducible.plazo + "/" + buscar).on("value", function (snapshot) {
        saldoFinalBonoArr = calculaSaldoFinalBono(snapshot.val());
        setSaldoFondoBono(saldoFinalBonoArr);
    });
}

function setSaldoFondoBono(saldoFinalBonoArr) {
  db.ref("SaldoFondo/Bono").set(saldoFinalBonoArr);
}

function calculaSaldoFinalBono(bono) {
  //console.log("bono", bono);
  $("#porcentajeBonoAcreditado").html(bono + "%");
  var bonoAcreditado = (deducible.aportacion * 12) * (bono/100);
  $("#bonoAcreditado").html(formatNumber.new(bonoAcreditado.toFixed(0), "$"));
  var saldoFinalBonoArr = [];

  var porcentajeBono = bono/100;
  var saldoAnterior = 0;
  var bonoCalculado = deducible.aportacion * porcentajeBono;

  for (var i = 0; i < deducible.plazo; i++) {
      var saldoFinalArr = [];
      for (var j = 1; j <= 12; j++) {
          if (i > 0) {
              bonoCalculado = 0;
          }

          var interes = (saldoAnterior + bonoCalculado) * deducible.interesMensual;
          var cargoAdministrativo = 0;
          if (j % 3 == 0) {
              cargoAdministrativo = ((saldoAnterior + bonoCalculado + interes) * .015) * -1;
          }

          var cargoGestionInvercion = ((saldoAnterior + bonoCalculado + interes) * .001) * -1;

          var saldoFinal = saldoAnterior + bonoCalculado + interes + cargoAdministrativo +cargoGestionInvercion;
          saldoFinalArr[j] = Number(saldoFinal.toFixed(0))  ;

          saldoAnterior = saldoFinal;
      }
      saldoFinalBonoArr[i] = saldoFinalArr;
  }
  return saldoFinalBonoArr;
}

function getSaldoComprometidoDeducible() {
    var aportacionAnual = deducible.aportacion * deducible.periodicidad;
    var buscar;
    var saldoComprometido;
    if (aportacionAnual < 12000) {
        buscar = 0;
    } else if (aportacionAnual == 12000 || aportacionAnual < 36000) {
        buscar = 12000;
    } else if (aportacionAnual == 36000 || aportacionAnual < 60000) {
        buscar = 36000;
    } else if (aportacionAnual == 60000 || aportacionAnual < 90000) {
        buscar = 60000;
    }else {
        buscar = 90000;
    }
    db.ref("tablaBonos/plazo" + deducible.plazo + "/" + buscar).on("value", function (snapshot) {
        saldoComprometido = calculaSaldoComprometido(snapshot.val());
        setSaldoFondoComprometido(saldoComprometido);
    });
}

function setSaldoFondoComprometido(saldoComprometido) {
  db.ref("SaldoFondo/Comprometido").set(saldoComprometido);
}

function calculaSaldoComprometido(bono) {
    var saldoComprometido = [];

    var saldoAnterior = 0;
    var porcentajeBono = bono/100;
    deducible.bono = porcentajeBono;
    var aportacion = deducible.aportacion;
    var bonoReal = 0;
    var interes = 0;
    var cargoFijo = 0;
    var cargoAdministrativo = 0;
    var cargoGestionInvercion = 0
    var saldoFinal = 0;

    cargoFijoArr.length = 0;
    for (var i = 0; i < deducible.plazo; i++) {
        //console.log("Año :::::::::::::::::::::::::::::::::::::::::::", i);
        var saldoFinalArr = [];
        calculaCargoFijio(i);
        for (var j = 1; j <= 12; j++) {
            //console.log("MES :::::::::::::::::::::::::::::::::::::::", j);
          var isCalculo = 0;
            if (i == 1 && j > 6) {
              isCalculo = 1;
            } else if (i > 1) {
              isCalculo = 1;
            }
            if (isCalculo == 1) {
              bonoReal = 0;
              interes = (saldoAnterior + aportacion + bonoReal) * deducible.interesMensual;
              var cargo = Number(cargoFijoArr[i]);

              cargoAdministrativo = 0;
              cargoGestionInvercion = ((saldoAnterior + aportacion + bonoReal + interes + cargo) * .001 * 1.16) * -1;
              saldoFinal = saldoAnterior + aportacion + bonoReal + interes + cargo + cargoAdministrativo + cargoGestionInvercion;
              //console.log("saldoFinal", saldoFinal.toFixed(0));

              saldoAnterior = saldoFinal;
            }
            saldoFinalArr[j] = Number(saldoFinal.toFixed(0));
        }
        saldoComprometido[i] = saldoFinalArr;
        var incremento = aportacion * .04;
        aportacion += incremento;
    }
    return saldoComprometido;
}

function calculaCargoFijio(año) {
  var cargoFijo = 0;
  var udi = 5.08;
  var inflacion = .04;
  if (año > 0) {
    if (año == 1) {
      cargoFijo = (15 * udi * (1 + inflacion) * 1.16) * -1;
    } else {
      cargoFijo = cargoFijoArr[año-1] * (1 + inflacion);
    }
  }
  cargoFijoArr[año] = cargoFijo;
}

function getSaldoInicialDeducible() {

  var tasaPortafolio = [];
  var saldoInicial;
  db.ref("tasaPortafolio").on("value", function (snapshot) {
    tasaPortafolio["pesosBalanceado"] = snapshot.val().pesosBalanceado;
    tasaPortafolio["pesosConservador"] = snapshot.val().pesosConservador;
    tasaPortafolio["pesosDinamico"] = snapshot.val().pesosDinamico;

    var multBalanceado = tasaPortafolio["pesosBalanceado"] * $("#pesosBalanceado").val();
    var multConservador = tasaPortafolio["pesosConservador"] * $("#pesosConservador").val();
    var multDinamico = tasaPortafolio["pesosDinamico"] * $("#pesosDinamico").val();
    var interesAnual = (multBalanceado + multDinamico + multConservador)/100;

    saldoInicial = calculaSaldoFinal(interesAnual);

    setSaldoFondoInicial(saldoInicial);
  });
};

function setSaldoFondoInicial(saldoInicial) {
  db.ref("SaldoFondo/Inicial").set(saldoInicial);
}

function calculaSaldoFinal(interesAnual) {
  var saldoInicial= [];

  interesMensual = Math.pow(1+interesAnual,1/12) - 1;
  deducible.interesAnual = interesAnual;
  deducible.interesMensual = interesMensual;

  var aportacion = Number(deducible.aportacion);
  var saldoAnterior = 0;
  for (var i = 0; i < deducible.plazo; i++) {
    var saldoFinalArr = [];
    for (var j = 1; j <= 12; j++) {

      if (i >= 1 && j > 6) {
        aportacion = 0;
      }
      var interes = (saldoAnterior + aportacion) * deducible.interesMensual;
      interes = Number(interes);
      var cargoFijo = 0;
      var cargoAdministrativo = 0;
      if (j == 1 && i == 0) {
        cargoFijo = -500;
      }
      if (j % 3 == 0) {
        cargoAdministrativo = ((saldoAnterior + aportacion + interes) * .015 * 1.16) * -1;
        cargoAdministrativo = Number(cargoAdministrativo);
      }
      var cargoGestionInvercion = ((saldoAnterior + aportacion + interes + cargoFijo + cargoAdministrativo) * .001 * 1.16) * -1;
      cargoGestionInvercion = Number(cargoGestionInvercion);
      var saldoFinal = saldoAnterior + aportacion + interes + cargoFijo + cargoAdministrativo +cargoGestionInvercion

      saldoAnterior = saldoFinal;
      saldoFinalArr[j] = Number(saldoFinal.toFixed(0));

    }
    saldoInicial[i] = saldoFinalArr;
    var incremento = aportacion * .04;
    aportacion += incremento;
  }
  return saldoInicial;
}

//autenticación con facebook con firebase


$("#loginfacebook").click(function () {
  var provider = new firebase.auth.FacebookAuthProvider();
  provider.addScope('email');
  provider.addScope('user_birthday');
  firebase.auth().signInWithPopup(provider).then(function(result) {
    // This gives you a Facebook Access Token. You can use it to access the Facebook API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    console.log("errorCode", errorCode);
    console.log("errorMessage", errorMessage);
    console.log("email", email);
    console.log("credential", credential);
  });
});

$("#logout").click(function () {
    firebase.auth().signOut().then(function() {
    // Sign-out successful.
  }, function(error) {
    // An error happened.
  });
});
