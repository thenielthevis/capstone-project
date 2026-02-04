import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';
type Category = 'global' | 'age_group' | 'gender' | 'fitness_level' | 'friends';
type Metric = 'score' | 'calories_burned' | 'activity_minutes' | 'streak';

interface FilterOption<T> {
  value: T;
  label: string;
  icon?: string;
}

const PERIOD_OPTIONS: FilterOption<Period>[] = [
  { value: 'daily', label: 'Today', icon: 'today-outline' },
  { value: 'weekly', label: 'This Week', icon: 'calendar-outline' },
  { value: 'monthly', label: 'This Month', icon: 'calendar-number-outline' },
  { value: 'all_time', label: 'All Time', icon: 'infinite-outline' },
];

const CATEGORY_OPTIONS: FilterOption<Category>[] = [
  { value: 'global', label: 'Global', icon: 'globe-outline' },
  { value: 'friends', label: 'Friends', icon: 'people-outline' },
  { value: 'age_group', label: 'Age Group', icon: 'calendar-outline' },
  { value: 'gender', label: 'Gender', icon: 'male-female-outline' },
  { value: 'fitness_level', label: 'Fitness Level', icon: 'fitness-outline' },
];

const METRIC_OPTIONS: FilterOption<Metric>[] = [
  { value: 'score', label: 'Score' },
  { value: 'calories_burned', label: 'Calories' },
  { value: 'activity_minutes', label: 'Activity' },
  { value: 'streak', label: 'Streak' },
];

interface DropdownProps<T> {
  label: string;
  options: FilterOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  accentColor: string;
}

function Dropdown<T extends string>({
  label,
  options,
  selectedValue,
  onSelect,
  accentColor,
}: DropdownProps<T>) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(opt => opt.value === selectedValue);
  
  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {selectedOption?.icon && (
            <Ionicons
              name={selectedOption.icon as any}
              size={18}
              color={accentColor}
              style={{ marginRight: 8 }}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 10, 
              color: theme.colors.textSecondary,
              fontFamily: theme.fonts.body,
              marginBottom: 2,
            }}>
              {label}
            </Text>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600',
              color: theme.colors.text,
              fontFamily: theme.fonts.body,
            }} numberOfLines={1}>
              {selectedOption?.label}
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-down"
          size={18}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
      
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32,
          }}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 320,
              backgroundColor: theme.colors.background,
              borderRadius: 16,
              overflow: 'hidden',
              maxHeight: 400,
            }}
          >
            <View style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.colors.text,
                fontFamily: theme.fonts.heading,
              }}>
                Select {label}
              </Text>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item.value);
                    setIsOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    backgroundColor: item.value === selectedValue 
                      ? accentColor + '15' 
                      : 'transparent',
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border + '40',
                  }}
                >
                  {item.icon && (
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: item.value === selectedValue 
                        ? accentColor + '20' 
                        : theme.colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={item.value === selectedValue 
                          ? accentColor 
                          : theme.colors.textSecondary}
                      />
                    </View>
                  )}
                  <Text style={{
                    flex: 1,
                    fontSize: 16,
                    color: item.value === selectedValue 
                      ? accentColor 
                      : theme.colors.text,
                    fontWeight: item.value === selectedValue ? '600' : '400',
                    fontFamily: theme.fonts.body,
                  }}>
                    {item.label}
                  </Text>
                  {item.value === selectedValue && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={accentColor}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

interface LeaderboardFiltersProps {
  period: Period;
  category: Category;
  metric: Metric;
  onPeriodChange: (period: Period) => void;
  onCategoryChange: (category: Category) => void;
  onMetricChange: (metric: Metric) => void;
}

export default function LeaderboardFilters({
  period,
  category,
  metric,
  onPeriodChange,
  onCategoryChange,
  onMetricChange,
}: LeaderboardFiltersProps) {
  const { theme } = useTheme();
  
  return (
    <View style={{ marginBottom: 16 }}>
      {/* Dropdown Filters Row */}
      <View style={{ 
        flexDirection: 'row', 
        paddingHorizontal: 16, 
        marginBottom: 12,
        gap: 10,
      }}>
        <Dropdown
          label="Time Range"
          options={PERIOD_OPTIONS}
          selectedValue={period}
          onSelect={onPeriodChange}
          accentColor={theme.colors.primary}
        />
        <Dropdown
          label="Category"
          options={CATEGORY_OPTIONS}
          selectedValue={category}
          onSelect={onCategoryChange}
          accentColor={theme.colors.accent}
        />
      </View>
      
      {/* Metric Filter - Segmented Control */}
      <View style={{ 
        flexDirection: 'row', 
        marginHorizontal: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
      }}>
        {METRIC_OPTIONS.map((option, index) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => onMetricChange(option.value)}
            style={{
              flex: 1,
              paddingVertical: 10,
              backgroundColor: metric === option.value 
                ? theme.colors.primary 
                : 'transparent',
              borderRightWidth: index !== METRIC_OPTIONS.length - 1 ? 1 : 0,
              borderRightColor: theme.colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: theme.fonts.body,
                textAlign: 'center',
                color: metric === option.value 
                  ? '#fff' 
                  : theme.colors.textSecondary,
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
