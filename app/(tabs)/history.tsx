import { Colors } from '@/constants/theme';
import { getResponsiveDimensions, isDesktop } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Mock data for price trends
const mockPriceData = {
  tomato: [
    { day: 'Mon', price: 45 },
    { day: 'Tue', price: 47 },
    { day: 'Wed', price: 50 },
    { day: 'Thu', price: 48 },
    { day: 'Fri', price: 52 },
    { day: 'Sat', price: 50 },
    { day: 'Sun', price: 50 },
  ],
  onion: [
    { day: 'Mon', price: 32 },
    { day: 'Tue', price: 30 },
    { day: 'Wed', price: 28 },
    { day: 'Thu', price: 30 },
    { day: 'Fri', price: 31 },
    { day: 'Sat', price: 30 },
    { day: 'Sun', price: 30 },
  ],
  wheat: [
    { day: 'Mon', price: 24 },
    { day: 'Tue', price: 25 },
    { day: 'Wed', price: 25 },
    { day: 'Thu', price: 26 },
    { day: 'Fri', price: 25 },
    { day: 'Sat', price: 25 },
    { day: 'Sun', price: 25 },
  ],
};

const { width: screenWidth } = Dimensions.get('window');

export default function HistoryScreen() {
  const [selectedCommodity, setSelectedCommodity] = useState('tomato');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const dimensions = getResponsiveDimensions();

  const periods = [
    { key: 'week', label: '1 Week' },
    { key: 'month', label: '1 Month' },
    { key: 'quarter', label: '3 Months' },
  ];

  const commodities = [
    { key: 'tomato', label: 'Tomato', color: Colors.light.primary },
    { key: 'onion', label: 'Onion', color: Colors.light.secondary },
    { key: 'wheat', label: 'Wheat', color: '#8B4513' },
  ];

  const currentData = mockPriceData[selectedCommodity as keyof typeof mockPriceData];
  const maxPrice = Math.max(...currentData.map(d => d.price));
  const minPrice = Math.min(...currentData.map(d => d.price));
  const priceRange = maxPrice - minPrice;

  const SimpleChart = () => {
    const chartWidth = isDesktop ? 400 : screenWidth - 80;
    const chartHeight = 200;
    const padding = 20;
    const innerWidth = chartWidth - (padding * 2);
    const innerHeight = chartHeight - (padding * 2);

    return (
      <View style={[styles.chartContainer, { width: chartWidth, height: chartHeight }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>₹{maxPrice}</Text>
          <Text style={styles.axisLabel}>₹{Math.round((maxPrice + minPrice) / 2)}</Text>
          <Text style={styles.axisLabel}>₹{minPrice}</Text>
        </View>

        {/* Chart area */}
        <View style={[styles.chartArea, { width: innerWidth, height: innerHeight }]}>
          {/* Grid lines */}
          <View style={styles.gridLines}>
            {[0, 0.5, 1].map((ratio, index) => (
              <View
                key={index}
                style={[
                  styles.gridLine,
                  { top: ratio * innerHeight }
                ]}
              />
            ))}
          </View>

          {/* Data points and lines */}
          <View style={styles.dataContainer}>
            {currentData.map((point, index) => {
              const x = (index / (currentData.length - 1)) * innerWidth;
              const y = innerHeight - ((point.price - minPrice) / priceRange) * innerHeight;
              
              return (
                <View key={index}>
                  {/* Data point */}
                  <View
                    style={[
                      styles.dataPoint,
                      {
                        left: x - 4,
                        top: y - 4,
                        backgroundColor: commodities.find(c => c.key === selectedCommodity)?.color,
                      }
                    ]}
                  />
                  
                  {/* Connecting line */}
                  {index < currentData.length - 1 && (
                    <View
                      style={[
                        styles.dataLine,
                        {
                          left: x,
                          top: y,
                          width: Math.sqrt(
                            Math.pow((currentData[index + 1].price - point.price) / priceRange * innerHeight, 2) +
                            Math.pow(innerWidth / (currentData.length - 1), 2)
                          ),
                          transform: [{
                            rotate: `${Math.atan(
                              ((currentData[index + 1].price - point.price) / priceRange * innerHeight) /
                              (innerWidth / (currentData.length - 1))
                            )}rad`
                          }],
                          backgroundColor: commodities.find(c => c.key === selectedCommodity)?.color,
                        }
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* X-axis labels */}
          <View style={styles.xAxis}>
            {currentData.map((point, index) => (
              <Text key={index} style={styles.xAxisLabel}>
                {point.day}
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { maxWidth: dimensions.containerMaxWidth }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Price History</Text>
            <Text style={styles.subtitle}>Track commodity price trends over time</Text>
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            <Text style={styles.sectionTitle}>Time Period</Text>
            <View style={styles.periodButtons}>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period.key && styles.periodButtonActive
                  ]}
                  onPress={() => setSelectedPeriod(period.key)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period.key && styles.periodButtonTextActive
                  ]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Commodity Selector */}
          <View style={styles.commoditySelector}>
            <Text style={styles.sectionTitle}>Commodity</Text>
            <View style={styles.commodityButtons}>
              {commodities.map((commodity) => (
                <TouchableOpacity
                  key={commodity.key}
                  style={[
                    styles.commodityButton,
                    selectedCommodity === commodity.key && styles.commodityButtonActive
                  ]}
                  onPress={() => setSelectedCommodity(commodity.key)}
                >
                  <View style={[
                    styles.commodityIndicator,
                    { backgroundColor: commodity.color }
                  ]} />
                  <Text style={[
                    styles.commodityButtonText,
                    selectedCommodity === commodity.key && styles.commodityButtonTextActive
                  ]}>
                    {commodity.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Chart */}
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Price Trend</Text>
            <View style={styles.chartWrapper}>
              <SimpleChart />
            </View>
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Current Price</Text>
                <Text style={styles.statValue}>
                  ₹{currentData[currentData.length - 1].price}/kg
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Highest</Text>
                <Text style={styles.statValue}>₹{maxPrice}/kg</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Lowest</Text>
                <Text style={styles.statValue}>₹{minPrice}/kg</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Average</Text>
                <Text style={styles.statValue}>
                  ₹{Math.round(currentData.reduce((sum, d) => sum + d.price, 0) / currentData.length)}/kg
                </Text>
              </View>
            </View>
          </View>

          {/* Price Change Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Price Change Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Ionicons name="trending-up" size={20} color={Colors.light.success} />
                <Text style={styles.summaryText}>
                  {selectedCommodity.charAt(0).toUpperCase() + selectedCommodity.slice(1)} prices 
                  {currentData[currentData.length - 1].price > currentData[0].price ? ' increased' : ' decreased'} by 
                  ₹{Math.abs(currentData[currentData.length - 1].price - currentData[0].price)}/kg 
                  this week
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="calendar" size={20} color={Colors.light.primary} />
                <Text style={styles.summaryText}>
                  Best day to buy: {currentData.find(d => d.price === minPrice)?.day} 
                  (₹{minPrice}/kg)
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    ...(isDesktop && {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingBottom: 40,
    }),
  },
  content: {
    flex: 1,
    paddingHorizontal: isDesktop ? 0 : 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 24,
    width: '100%',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: isDesktop ? 32 : 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: isDesktop ? 18 : 16,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  sectionTitle: {
    fontSize: isDesktop ? 20 : 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
    fontFamily: 'System',
  },
  periodSelector: {
    marginBottom: 32,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  periodButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: Colors.light.text,
    fontFamily: 'System',
  },
  periodButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  commoditySelector: {
    marginBottom: 32,
  },
  commodityButtons: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  commodityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  commodityButtonActive: {
    backgroundColor: Colors.light.primary + '20',
    borderColor: Colors.light.primary,
  },
  commodityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  commodityButtonText: {
    fontSize: 14,
    color: Colors.light.text,
    fontFamily: 'System',
  },
  commodityButtonTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  chartSection: {
    marginBottom: 32,
  },
  chartWrapper: {
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartContainer: {
    position: 'relative',
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 20,
  },
  yAxis: {
    position: 'absolute',
    left: 0,
    top: 20,
    height: 160,
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  chartArea: {
    position: 'relative',
    marginLeft: 40,
  },
  gridLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dataContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dataLine: {
    position: 'absolute',
    height: 2,
  },
  xAxis: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  xAxisLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    textAlign: 'center',
    fontFamily: 'System',
  },
  statsContainer: {
    marginBottom: 32,
  },
  statsGrid: {
    ...(isDesktop ? {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 16,
    } : {
      gap: 16,
    }),
  },
  statCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    ...(isDesktop && {
      flex: 1,
      minWidth: 150,
    }),
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 8,
    fontFamily: 'System',
  },
  statValue: {
    fontSize: isDesktop ? 20 : 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
    fontFamily: 'System',
  },
  summaryContainer: {
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 12,
    fontFamily: 'System',
  },
});
