$(function() {

    var container = $("#flot-line-chart-moving");
    var mqtt_icon = $("#mqtt-icon");
    var mqtt_status = $("#mqtt-status");
    var mqtt_panel = $("#mqtt-panel");
    var led_icon = $("#led-icon");
    var led_status = $("#led-status");
    var led_panel = $("#led-panel");
    var led_button = $("#led-cutton");

    // Determine how many data points to keep based on the placeholder's initial size;
    // this gives us a nice high-res plot while avoiding more than one point per pixel.
    var totalPoints = container.outerWidth() / 20 || 100;;

    var data = [];

    var led = false;

    var dataset = [
        { label: "LDR", data: data, color: "#00FFee" }
    ];

    // Update Graph
    var update = function () {
        $.plot(container, dataset, {
            grid: {
                borderWidth: 1,
                minBorderMargin: 20,
                labelMargin: 10,
                backgroundColor: {
                    colors: ["#fff", "#e4f4f4"]
                },
                margin: {
                    top: 8,
                    bottom: 20,
                    left: 20
                },
                markings: function(axes) {
                    var markings = [];
                    var xaxis = axes.xaxis;
                    for (var x = Math.floor(xaxis.min); x < xaxis.max; x += xaxis.tickSize * 2) {
                        markings.push({
                            xaxis: {
                                from: x,
                                to: x + xaxis.tickSize
                            },
                            color: "rgba(232, 232, 255, 0.2)"
                        });
                    }
                    return markings;
                }
            },
            legend: {        
                labelBoxBorderColor: "#fff"
            },
            series: {
                lines: {
                    show: true,
                    lineWidth: 1.2,
                    fill: true
                }
            },
            yaxis: {
                min: 0,
                max: 1024
            },
            xaxis: {
                mode: "time",
                tickSize: [2, "second"],
                tickFormatter: function (v, axis) {
                    var date = new Date(v);
             
                    if (date.getSeconds() % 5 == 0) {
                        var hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
                        var minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
                        var seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
             
                        return hours + ":" + minutes + ":" + seconds;
                    } else {
                        return " ";
                    }
                },
                axisLabel: "Time",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 10
            },
        });
    }

    // Boker info
    var hostname = "broker.mqttdashboard.com";
    var port = 8000;
    var clientid = "cpe24-demo-"+parseInt(Math.random() * 100000, 16);

    var LED_TOPIC = "cpe24mqttdemo/led";
    var LDR_TOPIC = "cpe24mqttdemo/ldr";

    var client = new Messaging.Client(hostname, port, clientid);
 
    var options = {

        //connection attempt timeout in seconds
        timeout: 3,

        //Gets Called if the connection has successfully been established
        onSuccess: function () {
            console.log("Connected");
            mqtt_status.text("OK");
            mqtt_icon.removeClass("fa-close");
            mqtt_icon.addClass("fa-check");
            mqtt_panel.removeClass("panel-danger");
            mqtt_panel.addClass("panel-primary");
            // Subscibe TOPIC
            client.subscribe(LDR_TOPIC, {qos: 2});
            client.subscribe(LED_TOPIC, {qos: 2});
        },

        //Gets Called if the connection could not be established
        onFailure: function (message) {
            console.log("Connection failed: " + message.errorMessage);
            mqtt_status.text("ERROR");
        },

    };
     
    //Attempt to connect
    client.connect(options);

    // Handle incomming subscibed Message from broker
    client.onMessageArrived = function (message) {
        var topic = message.destinationName;
        var payload = message.payloadString;

        console.log('Topic: ' + topic + '  | ' + payload);

        if(topic == LDR_TOPIC) {
            data.push([new Date().getTime(), parseInt(payload,10)]);
            if(data.length>totalPoints)
                data.shift();
            update();
        }else if (topic==LED_TOPIC) {
            if(payload == "1") {
                led_status.text("On");
                led_icon.removeClass("fa-toggle-off");
                led_icon.addClass("fa-toggle-on");
                led_panel.removeClass("panel-warning");
                led_panel.addClass("panel-green");
                led = true;
            }else{
                led_status.text("Off");
                led_icon.removeClass("fa-toggle-on");
                led_icon.addClass("fa-toggle-off");
                led_panel.removeClass("panel-green");
                led_panel.addClass("panel-warning");
                led = false;
            }
        }
    };

    // Public on/off message when toggle icon was clicked
    led_icon.click(function(){
        publish(led?"0":"1", LED_TOPIC, 2);
    });

    //Creates a new Messaging.Message Object and sends it to the HiveMQ MQTT Broker
    var publish = function (payload, topic, qos) {
        var message = new Messaging.Message(payload);
        message.destinationName = topic;
        message.qos = qos;
        message.retained = true;
        client.send(message);
    }

});