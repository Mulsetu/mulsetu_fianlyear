import React from "react";
import { Image, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";

const LandingScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/mulsetu_logo.png")}
          style={styles.logo}
        />
        <Text style={styles.appName}>Mulsetu</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 24,
  },
  logo: {
    width: 160,
    height: 160,
    resizeMode: "contain",
    marginBottom: 16,
  },
  appName: {
    color: colors.primaryTeal,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default LandingScreen;


