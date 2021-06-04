import { StatusBar } from 'expo-status-bar';
import React, {Component, useEffect,useCallback, useState} from 'react';
import {Alert, Platform, StyleSheet, Text, View, BackHandler, ToastAndroid} from 'react-native';
import {WebView} from 'react-native-webview';
import { Firebase,Notification, NotificationOpen } from 'react-native-firebase';
import firebase from 'firebase'; 
import DeviceInfo from 'react-native-device-info';
import messaging from '@react-native-firebase/messaging'
import { ConfirmDialog } from 'react-native-simple-dialogs';
export default function App() {
  const [appWebView,setAppWebView] = useState(null);
  const [pushToken, setPushToken] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [domain, setDomain] = useState("https://www.plismplus.com")
  const [deviceId] = useState(DeviceInfo.getUniqueId())
  const [deviceModel] = useState(DeviceInfo.getModel());
  const [exitApp, setExitApp] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);


  //const [domain, setDomain] = useState("https://dev.plismplus.com")
  useEffect(() => {
    handlePushToken()
    saveDeviceToken()
    requestUserPermission()
    
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('remoteMessage===',Platform.OS,remoteMessage)
      
    })
    return unsubscribe;
  }, [])

  useEffect(() => {

    setTimeout(()=> {
      if (Platform.OS === 'android') {
        BackHandler.addEventListener('hardwareBackPress', () => onAndroidBackPress());
      }
    },300)
   return() => {
    if (Platform.OS === 'android') {
      this.exitApp=false
      BackHandler.removeEventListener('hardwareBackPress');
    }
   };
  })



  async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
    if (enabled) {
      console.log(Platform.OS,'Authorization status:', authStatus);
    }
  }

  const handlePushToken = useCallback(async () => {
    const enabled = await messaging().hasPermission()
    if (enabled) {
      const fcmToken = await messaging().getToken()
      if (fcmToken) setPushToken(fcmToken)
    } else {
      const authorizaed = await messaging.requestPermission()
      if (authorized) setIsAuthorized(true)
    }
  }, [])

  
  const saveTokenToDatabase = useCallback(async (token) => {
    const { error } = await setFcmToken(token)
    if (error) throw Error(error)
  }, [])


  const saveDeviceToken = useCallback(async () => {
    if (isAuthorized) {
      const currentFcmToken = await firebase.messaging().getToken()
      if (currentFcmToken !== pushToken) {
        return saveTokenToDatabase(currentFcmToken)
      }

      return messaging().onTokenRefresh((token) => saveTokenToDatabase(token))
    }
  }, [pushToken, isAuthorized])
  





  const onWebViewMessage = event => {


    console.log("Message received from webview");

    let msgData;
    try {
      msgData = JSON.parse(event.nativeEvent.data);
    } catch (err) {
      console.warn(err);
      return;
    }

    switch (msgData.targetFunc) {
      case "getToken":
        
        this[msgData.targetFunc].apply(this, [msgData]);
        break;
    }
  }

getToken = (msgData) => {
    const data = {
      token:pushToken,
      deviceId:deviceId,
      deviceModel:deviceModel,
      os:Platform.OS
    }
    console.log(msgData)
    msgData.data= data;
    msgData.isSuccessfull = true;
    // msgData.args = [msgData.data % 2 ? "green" : "red"];
    appWebView.postMessage(JSON.stringify(msgData));
}








  const onAndroidBackPress = () => {
    console.log('cangoBack',canGoBack)
    const timeout = setTimeout(()=> {
      setExitApp(false)
    },2000);
    if (canGoBack && appWebView) {
      appWebView.goBack();
      return true;
    }else if (!canGoBack && appWebView) {
      if (this.exitApp == undefined || !this.exitApp) {
        ToastAndroid.show('한번 더 누르시면 종료됩니다.', ToastAndroid.SHORT);
        this.exitApp = true;

        this.timeout = setTimeout(
            () => {
                this.exitApp = false;
            },
            2000    // 2초
        );
    } else {
        clearTimeout(this.timeout);

        BackHandler.exitApp();  // 앱 종료
    }
    return true;

      
    }
    return false;
    // return false;
            // 2000(2초) 안에 back 버튼을 한번 더 클릭 할 경우 앱 종료
          //   if (this.exitApp == undefined || !this.exitApp) {
          //     ToastAndroid.show('한번 더 누르시면 종료됩니다.', ToastAndroid.SHORT);
          //     this.exitApp = true;
  
          //     this.timeout = setTimeout(
          //         () => {
          //             this.exitApp = false;
          //         },
          //         2000    // 2초
          //     );
          // } else {
          //     clearTimeout(this.timeout);
  
          //     BackHandler.exitApp();  // 앱 종료
          // }
          // return true;
  }
  return (
    <WebView
      originWhitelist={['*']}
      source={{ uri:domain }}
      onMessage={onWebViewMessage}
      javaScriptEnabled={true}
      useWebKit={true}
      allowFileAccess={true}
      scalesPageToFit={true}
      ref={webview => {setAppWebView(webview);}}
      onNavigationStateChange={(nav) => {setCanGoBack(nav.canGoBack); console.log('nav',nav.canGoBack)}}>


      </WebView>
  );
}






