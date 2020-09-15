import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';

//THIS SECTION BELOW (BE CAREFUL, OUTSIDE OF App Function) HELPS NOTIFICATIONS SHOWN NOT BACKGROUND, SHOWN ABOVE THE APP
//Without this code below, Notifications always stays at the background/below the app
//-start
Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: false,
    };
  },
});
//-end

export default function App() {
  const [pushToken, setPushToken] = useState();

  useEffect(() => {
    Permissions.getAsync(Permissions.NOTIFICATIONS)
      .then((statusObj) => {
        if (statusObj.status !== 'granted') {
          Permissions.askAsync(Permissions.NOTIFICATIONS);
        }
        return statusObj; //for just make it available for next "then" block
      })
      .then((statusObj) => {
        if (statusObj.status !== 'granted') {
          //altert('...')
          //return;
          throw new Error('Permission not granted!');
        }
      })
      //this then block below accessible only Permissions.NOTIFICATIONS available
      //the 2 then block above used for local notifications, but the then block below is for push notifications!
      .then(() => {
        //the method below talks to Expo Push Notifications Server
        //but not works on emulators/simulators!
        return Notifications.getExpoPushTokenAsync();
      })
      .then((response) => {
        console.log(response);
        const token = response.data;
        setPushToken(token);
      })
      .catch((err) => {
        //console.log(err);
        return null;
      });
  }, []);

  useEffect(() => {
    //when the app catches a notification
    const backgroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        //you can access all info about the notification and also some data if put inside the notification but not shown to the user: for example mySpecialData in the code below!
        console.log(notification);
      }
    );

    //when the user interacts with the notification box
    const foreGroundSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log(response);
      }
    );

    return () => {
      backgroundSubscription.remove();
      foreGroundSubscription.remove();
    };
  }, []);

  const triggerNotificationHandler = () => {
    //this is how locally notifications triggered
    // Notifications.scheduleNotificationAsync({
    //   content: {
    //     title: 'My first local notification',
    //     body: 'This is the first local notification we are sending ...',
    //     data: { mySpecialData: '+905322001010' },
    //   },
    //   trigger: {
    //     seconds: 10,
    //   },
    // });

    //this is how send/push notifications to expo push server
    //does the same job with the page "Expo Push notifications tool": https://expo.io/notifications
    fetch(`https://exp.host/--/api/v2/push/send`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        data: { extraData: 'some data' },
        title: 'Sent via the app',
        body: 'This push notification was sent via the app!',
      }),
    });
  };

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <Button
        title="Trigger Notification"
        onPress={triggerNotificationHandler}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Example of data returned from Notifications.getExpoPushTokenAsync() call
// This token is like my address
/*
Object {
  "data": "ExponentPushToken[i3VODGH4qhHsIWRw......]",
  "type": "expo",
}
*/
